import { FastifyReply, FastifyRequest } from "fastify";
import { CreateUserInput, Enable2FAInput, LoginUserInput, LoginWauthInput ,Verify2FA, CreateUserWauthnInput, ChallengeInput ,CredentialInput} from "./userSchema";
import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { tableExists, createChallengeTable, createUsersTable } from "../../utils/tableCheck";
import { invalidateSession, isSessionActive } from "../../utils/session";
const webauthnModule = import("@passwordless-id/webauthn");

const speakeasy = require('speakeasy')
const qrcode = require('qrcode')

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'userdb',
  password: 'your_password',
  port: 5433,
})

const SALT_ROUNDS = 10;

export async function createUser(
  req: FastifyRequest<{Body: CreateUserInput}>, reply: FastifyReply) {
    console.log(req.body);
    const { email, username} = req.body;  
  
    try {
      
      if (!(await tableExists('users'))) {
        await createUsersTable();
      }

      const connection = await pool.connect();

      const usernameResult = await connection.query(
        'SELECT * FROM users WHERE username = $1',
        [username],
      );

      if (usernameResult.rows.length > 0) {
        return reply.status(400).send({ message: 'Username already exists' });
      }

      const emailResult = await connection.query(
        'SELECT * FROM users WHERE email = $1',
        [email],
      );
    
      if (emailResult.rows.length > 0) {
        return reply.status(400).send({ message: 'Email already exists' });
      }
    
      // const hash = await bcrypt.hash(password, SALT_ROUNDS)

      const result = await connection.query(
        'INSERT INTO users (username, email, password) values ($1,$2);',
        [`${username}`, `${email}`]
      )  
      connection.release();

      
      return reply.code(201).send({status: true , message: 'User Created Successfully'});
      
    } catch (err) {
      return reply.code(500).send(err)
    }
  }

export async function login(
    req: FastifyRequest<{Body: LoginUserInput}>, reply: FastifyReply) {

    const { username, password } = req.body;
    try {
      const connection = await pool.connect();
      
      const user = await connection.query(
        'SELECT * FROM users WHERE username = $1',
        [username],
      );

      const passwordMatch = user && (await bcrypt.compare(password, user.rows[0].password));
      


      if (!user || !passwordMatch) {
        connection.release();
        return reply.code(401).send({ message: 'Invalid username or password' });
      }

      connection.release()

      const payload = {
        id: user.rows[0].id,
        email: user.rows[0].email,
        username: user.rows[0].username
      }

      const token = req.jwt.sign(payload)

      reply.setCookie('access_token', token, {
        path: '/',
        httpOnly: true,
        secure: true,
      })

      return reply.code(201).send({accessToken: token, status: true, is_2fa_enabled: user.rows[0].is_2fa_enabled , message: 'Login Successful'});

    } catch(err) {
      return reply.code(500).send(err);
    }
  }

export async function logout(req: FastifyRequest, reply: FastifyReply) {
  await invalidateSession(req.user.username);
  reply.clearCookie('access_token')
  return reply.send({ message: 'Logout successful' })
}

export async function generateChallenge(
  req: FastifyRequest<{Body: ChallengeInput}>, reply: FastifyReply) {
    const { sessionID } = req.body
    try {
      if (!(await tableExists('challenge'))) {
        await createChallengeTable();
      }

      const challenge = (await webauthnModule).utils.randomChallenge()

      const connection = await pool.connect();

      const result = await connection.query(
        'INSERT INTO challenge (sessionID, challenge) values ($1,$2);',
        [`${sessionID}`, `${challenge}`]
      )  
      connection.release();

      reply.code(200).send(challenge)
    } catch(err) {
      return reply.code(500).send(err);
    }
  }

export async function findCredential(req: FastifyRequest<{Body: CredentialInput}>, reply: FastifyReply){
  const { username } = req.body
  try {


    const connection = await pool.connect();

    const credentialKey = await connection.query(
      'SELECT credentialKey FROM users WHERE username = $1',
      [username]
    );
    connection.release();
    console.log("credentialKey", credentialKey);
    const parsedCredential = credentialKey.rows[0].credentialkey;
    console.log(parsedCredential);
    reply.code(200).send(parsedCredential.id);
  } catch(err) {
    return reply.code(500).send(err);
  }
}

export async function enable2fa(
  req: FastifyRequest<{Body: Enable2FAInput}>, reply: FastifyReply) {
    
    const {username} = req.body;
    try {
      var secret = speakeasy.generateSecret({
        name: username
      })

      const connection = await pool.connect();
      
      const result = await connection.query(
        'UPDATE users SET secret_key = $1 WHERE username = $2',
        [secret.ascii, username]
      );

      connection.release();
    
      const qr = await new Promise<string>((resolve, reject) => {
        qrcode.toDataURL(secret.otpauth_url, (err: any, data: string) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
      
      
      return reply.code(201).send({
        status: true,
        message: 'Two-Factor Authentication enabled successfully',
        qr: qr
      });

    } catch (err) {
      return reply.status(500).send({status: false, error:err});
    }
  }

export async function verify2fa(
  req: FastifyRequest<{Body: Verify2FA}>, reply: FastifyReply) {
    const {username, code} = req.body;
    try {
      const connection = await pool.connect();

      const result = await connection.query(
        'SELECT secret_key FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return reply.status(404).send({
          status: false,
          message: 'User not found',
        });
      }


      const secretKey = result.rows[0].secret_key;

      const verified = speakeasy.totp.verify({
        secret: secretKey,
        encoding: 'ascii',
        token: code,
      });

      if (verified) {
        await connection.query(
          'UPDATE users SET is_2fa_enabled = $1 WHERE username = $2',
          [true, username]
        );
      }

      connection.release();

      if (!verified) {
        return reply.send({
          status: false,
          message: 'Invalid Two-Factor Authentication code',
        });
      }
      
      return reply.send({
        status: true,
        message: 'Two-Factor Authentication code verified successfully',
      });
      
    } catch (err) {
      return reply.status(500).send({status: false, error:err});
    }
  }

export async function createUserWebauthn(
  req: FastifyRequest<{Body: CreateUserWauthnInput}>, reply: FastifyReply) {
    const { email, username, challenge, sessionID, registration} = req.body;  

    try {

      if (!(await tableExists('users'))) {
        await createUsersTable();
      }
      const connection = await pool.connect();

      // TO ADD: get challenge based on the {sessionID, challenge} row from sesions table andverify the challenge string, return error if unsuccessful

      // inplement server.verify

      // const usernameResult = await connection.query(
      //   'SELECT * FROM users WHERE username = $1',
      //   [username],
      // );

      // if (usernameResult.rows.length > 0) {
      //   return reply.status(400).send({ message: 'Username already exists' });
      // }

      // const emailResult = await connection.query(
      //   'SELECT * FROM users WHERE email = $1',
      //   [email],
      // );
    
      // if (emailResult.rows.length > 0) {
      //   return reply.status(400).send({ message: 'Email already exists' });
      // }
    
      // const hash = await bcrypt.hash(password, SALT_ROUNDS);

      const challenge_user = await connection.query(
        'SELECT challenge FROM challenge WHERE sessionID = $1',
        [sessionID]
      );

      console.log("challenge_user", challenge_user.rows[0].challenge);
      console.log("challenege", challenge);
      console.log("registration", registration);
      const expected = {
        challenge: challenge_user.rows[0].challenge,
        origin: "http://localhost:5173"
      }

      const registrationParsed = await (await webauthnModule).server.verifyRegistration(registration, expected);
      console.log("parsedRegistration",registrationParsed);
      const credentialJSON = JSON.stringify(registrationParsed.credential);
      const result = await connection.query(
        'INSERT INTO users (username, email, webauthn, credentialKey) values ($1,$2,$3,$4);',
        [`${username}`, `${email}`,`${true}`,`${credentialJSON}`]
      )  
      connection.release();

      // console.log(challenge)
      return reply.code(201).send({status: true , message: {'Challenge: ': challenge}});
      // return reply.code(201).send(challenge);
      
    } catch (err) {
      return reply.code(500).send(err)
    }
  }

  export async function loginWebauthn(
    req: FastifyRequest<{Body: LoginWauthInput}>, reply: FastifyReply) {

    const { username, authentication, sessionID, challenge } = req.body;
    try {
      if (!(await tableExists('users'))) {
        await createUsersTable();
      }

      const connection = await pool.connect();
      
      const user = await connection.query(
        'SELECT * FROM users WHERE username = $1',
        [username],
      );

      // const passwordMatch = user && (await bcrypt.compare(password, user.rows[0].password));

      if (!user ) {
        connection.release();
        return reply.code(401).send({ message: 'Invalid username or password' });
      }

      const isActive = await isSessionActive(req.body.username)
      if (isActive) {
        return reply.code(402).send({ message: 'Login failed: Active session found'})
      }

      const challenge_user = await connection.query(
        'SELECT challenge FROM challenge WHERE sessionID = $1',
        [sessionID]
      );

      console.log("challenge from login sessionID ", challenge_user)

      connection.release()

      const expected = {
        challenge: challenge_user.rows[0].challenge, // whatever was randomly generated by the server.
        origin: "http://localhost:5173",
        userVerified: true, // should be set if `userVerification` was set to `required` in the authentication options (default)
       // Optional. For device-bound credentials, you should verify the authenticator "usage" counter increased since last time.
      }

      const authenticationParsed = await  (await webauthnModule).server.verifyAuthentication(authentication, user.rows[0].credentialkey, expected)

      const signature = authenticationParsed.signature

      console.log("authenticationParsed", authenticationParsed);

      const payload = {
        username: username,
        signature: signature
      }
      const token = req.jwt.sign(payload)

      reply.setCookie('access_token', token, {
        path:'/',
        httpOnly: true,
        secure: true,
      })

      return reply.code(201).send({status: true, payload, message: 'Login Successful'});

    } catch(err) {
      return reply.code(500).send(err);
    }
  }
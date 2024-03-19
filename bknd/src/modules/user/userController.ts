import { FastifyReply, FastifyRequest } from "fastify";
import { CreateUserInput, Enable2FAInput, LoginUserInput, Verify2FA, CreateUserWauthnInput, ChallengeInput } from "./userSchema";
import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { table } from "console";
// import { utils } from "@passwordless-id/webauthn";
const someModule = import("@passwordless-id/webauthn");
// import * as webauthn from '@passwordless-id/webauthn' 

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

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const connection = await pool.connect();
    const result = await connection.query(`
      SELECT EXISTS (
        SELECT * FROM information_schema.tables
        WHERE table_name = $1
      ) AS exists;
    `, [tableName]);

    connection.release();
    return result.rows[0].exists;
  } catch (err) {
    console.error('Error checking table existence:', err);
    return false; // Handle potential errors gracefully
  }
}

async function createUsersTable() {
  try {
    const connection = await pool.connect();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        webauthn BOOLEAN NOT NULL DEFAULT FALSE
        credentialKey JSONB DEFAULT NULL
      );
    `;
    await connection.query(createTableQuery);
    connection.release();
  } catch (err) {
    console.error('Error creating users table:', err);
  }
}

async function createChallengeTable() {
  try {
    const connection = await pool.connect();
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS challenge (
        id SERIAL PRIMARY KEY,
        sessionID VARCHAR(255) UNIQUE NOT NULL,
        challenge VARCHAR(255) NOT NULL,
      );
    `;
    await connection.query(createTableQuery);
    connection.release();
  } catch (err) {
    console.error('Error creating challenge table:', err);
  }
}

export async function createUser(
  req: FastifyRequest<{Body: CreateUserInput}>, reply: FastifyReply) {
    console.log(req.body);
    const {password, email, username} = req.body;  
  
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
    
      const hash = await bcrypt.hash(password, SALT_ROUNDS)

      const result = await connection.query(
        'INSERT INTO users (username, email, password) values ($1,$2,$3);',
        [`${username}`, `${email}`, `${hash}`]
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

      const challenge = (await someModule).utils.randomChallenge()

      const connection = await pool.connect();

      const result = await connection.query(
        'INSERT INTO users (sessionID, challenge) values ($1,$2);',
        [`${sessionID}`, `${challenge}`]
      )  
      connection.release();

      reply.code(200).send(challenge)
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
    const {password, email, username, challenge, sessionID} = req.body;  

    try {
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
    
      const hash = await bcrypt.hash(password, SALT_ROUNDS)

      const result = await connection.query(
        'INSERT INTO users (username, email, password) values ($1,$2,$3);',
        [`${username}`, `${email}`, `${hash}`]
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
import { FastifyInstance} from 'fastify'
import { createUser, login, logout, enable2fa, verify2fa, generateChallenge, createUserWebauthn, loginWebauthn,  } from './userController'
import { CreateUserInput, LoginUserInput, Enable2FAInput, Verify2FA, CreateUserWauthnInput, ChallengeInput } from './userSchema'

export async function userRoutes(app: FastifyInstance) {

  app.post<{ Body: ChallengeInput}>('/challenge', generateChallenge)

  // app.get('/', (req: FastifyRequest, reply: FastifyReply) => {
  //   reply.send({ message: '/ route hit   Hello there! 👋' })
  // })

  app.post<{ Body: CreateUserInput, }>('/signup', createUser);

  app.post<{ Body: LoginUserInput }>('/login', login);

  app.delete('/logout', {preHandler: [app.authenticate]}, logout);

  app.post<{ Body: Enable2FAInput }>('/enable2FA', {preHandler: [app.authenticate]}, enable2fa);

  app.post<{ Body: Verify2FA }>('/verify2FA', {preHandler: [app.authenticate]}, verify2fa)

  app.post<{ Body: CreateUserWauthnInput, }>('/signup-webauthn', createUserWebauthn);

  app.post<{ Body: LoginUserInput }>('/login-webauthn', loginWebauthn);

  app.log.info('user routes registered');
}
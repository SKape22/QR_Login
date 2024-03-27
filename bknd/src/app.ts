import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import { userRoutes } from './modules/user/user.route';
import { userSchemas } from './modules/user/user.schema';
import fjwt, { FastifyJWT } from '@fastify/jwt'
import fCookie from '@fastify/cookie'
import './utils/types'
import { isSessionActive } from './utils/session';

const app: FastifyInstance = fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>()

app.register(cors, {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})

for (let schema of [...userSchemas]) {
  app.addSchema(schema)
}

app.register(userRoutes, {prefix:'api/v1/users'})

app.register(fjwt, { secret: 'supersecretkey' })

app.addHook('preHandler', (req, res, next) => {
  req.jwt = app.jwt;
  return next();
})

app.register(fCookie, {
  secret: 'supersecretkey',
  hook: 'preHandler',
})

app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
  let token = req.cookies.access_token || ""
  console.log("\n\ntoken:",token,"\n\n")
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    const [bearer, tokenFromHeader] = authHeader.split(' ');
    if (bearer === 'Bearer' && tokenFromHeader)
      token = tokenFromHeader;
  }
  console.log("\n\ntoken after:",token,"\n\n")

  if (!token) {
    return reply.status(401).send({ message: 'Authentication required' })
  }
  const decoded = req.jwt.verify<FastifyJWT['user']>(token)
  console.log("\n\n",decoded,"\n\n")
  req.user = decoded

  const isActive = await isSessionActive(decoded.username)
  if (!isActive) {
    return reply.status(401).send({ message: 'Session expired or invalid'})
  }
})

const PORT = '3000'
const ADDRESS = '0.0.0.0'

const listeners = ['SIGINT', 'SIGTERM']
listeners.forEach((signal) => {
  process.on(signal, async () => {
    await app.close()
    process.exit(0)
  })
})


const start = async () => {
  try {
    app.listen({ 
      host: ADDRESS, 
      port: parseInt(PORT, 10) 
    })
  } catch(error) {
    app.log.error(error);
    process.exit(1);
  }
}

start()
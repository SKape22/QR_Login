import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import cors from '@fastify/cors';
import { userRoutes } from './modules/user/userRoute';
import { userSchemas } from './modules/user/userSchema';
import fjwt, { FastifyJWT } from '@fastify/jwt'
import fCookie from '@fastify/cookie'
import { CronJob } from 'cron';
import deleteExpiredChallenges from './utils/schedule';
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

  // if (!token && req.headers.authorization) {
  //   const authHeader = req.headers.authorization;
  //   const [bearer, tokenFromHeader] = authHeader.split(' ');
  //   if (bearer === 'Bearer' && tokenFromHeader)
  //     token = tokenFromHeader;
  // }
  if (!token) {
    return reply.status(401).send({ message: 'Authentication required' })
  }

  const decoded = req.jwt.verify<FastifyJWT['user']>(token)
  req.user = decoded

  const isActive = await isSessionActive(decoded.username)
  if (!isActive) {
    return reply.status(401).send({ message: 'Session expired or invalid'})
  }
})
// app.register(userRoutes, {prefix: "api/v1/users"})

// const UserSchema = Type.Object({
//   username: Type.String(),
//   password: Type.String()
// });


// interface Iheaders {
//   'h-custom': string
// }

// interface IReply {
//   200: { your_username: string, your_password: string };
//   302: { url: string };
//   '4xx': { error: string };
//   500: {error: any}
// }

// app.get('/', async (request, reply) => {
//   return 'Hello there! 👋'
// })

// app.post<{ Body: UserType }>('/api/users/login', {schema: {body: UserSchema}}, async (request, reply) => {
//     try {
//       console.log(request)
//       console.log("login request received")
//       const userDetails = request.body;
//       console.log(userDetails)
//       reply.code(200).send("USer created Successfully")

//     } catch (err: any) {
//       reply.status(500).send(err);
//     }
//   }
// )

// app.post<{Body: UserType, Reply: UserType }>('/api/users/signup', async (request, reply) => {
//   console.log(request.body)
//   try {

//     console.log("login request received")
//     console.log(request.body);
//     console.log(request.body.username);
//     const { username, password } = request.body;
//     reply.code(200).send({username: username, password: password})

//   } catch (err: any) {
//     reply.status(500).send(err);
//   }
// }
// )

const job = new CronJob(
          '*/5 * * * *', 
          function() {
            deleteExpiredChallenges();
          },
          null,
          true
          );


const PORT = '3000'
const ADDRESS = '0.0.0.0'

// app.listen({ host: ADDRESS, port: parseInt(PORT, 10) }, (err, address) => {
//   if (err) {
//     console.error(err)
//     process.exit(1)
//   }
//   console.log(`Server started at ${address}`)
// })

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
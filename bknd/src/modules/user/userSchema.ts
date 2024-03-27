import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const createUserSchema = z.object({
  email: z.string(),

  username: z.string()
})

const createUserWauthnSchema = z.object({
  email: z.string(),

  username: z.string(),
  challenge: z.string(),
  sessionID: z.string(),
  registration: z.object({
    username: z.string(),
    credential: z.object({
      id: z.string(),
      publicKey: z.string(),
      algorithm: z.enum(["RS256", "ES256"]) // Specify the allowed values for algorithm
    }),
    authenticatorData: z.string(),
    clientData: z.string()
  })
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export type CreateUserWauthnInput = z.infer<typeof createUserWauthnSchema>

const createUserResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string(),
})

const loginSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be a string',
    }),
  password: z.string().min(6),
})

const loginWauthSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
      invalid_type_error: 'Username must be a string',
    }),

    challenge: z.string(),
    sessionID: z.string(),
    authentication: z.object({
      credentialId: z.string(),
      authenticatorData: z.string(),
      clientData: z.string(),
      signature: z.string(),
    })

})

export type LoginUserInput = z.infer<typeof loginSchema>

export type LoginWauthInput = z.infer<typeof loginWauthSchema>

const loginResponseSchema = z.object({
  accessToken: z.string(),
})

const challengeSchema = z.object({
  sessionID: z.string()
}) 

const credentialSchema = z.object({
  username: z.string()
})

export type CredentialInput = z.infer<typeof credentialSchema>

export type ChallengeInput = z.infer<typeof challengeSchema>

const enable2faSchema = z.object({
  username: z.string()
})

export type Enable2FAInput = z.infer<typeof enable2faSchema>

const responseSchema2FA = z.object({
  message: z.string(),
  qr: z.string()
})

const verify2faSchema = z.object({
  username: z.string(),
  code: z.string()
})

export type Verify2FA = z.infer<typeof verify2faSchema>

export const { schemas: userSchemas, $ref } = buildJsonSchemas({
  createUserSchema,
  createUserResponseSchema,
  loginSchema,
  loginWauthSchema,
  loginResponseSchema,
  challengeSchema,
  enable2faSchema,
  responseSchema2FA,
  verify2faSchema
})
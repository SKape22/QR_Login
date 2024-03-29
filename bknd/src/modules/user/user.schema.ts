import { z } from 'zod'
import { buildJsonSchemas } from 'fastify-zod'

const createUserSchema = z.object({
  email: z.string(),
  password: z.string().min(6),
  username: z.string()
})

export type CreateUserInput = z.infer<typeof createUserSchema>

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

export type LoginUserInput = z.infer<typeof loginSchema>

const loginResponseSchema = z.object({
  accessToken: z.string(),
})

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
  loginResponseSchema,
  enable2faSchema,
  responseSchema2FA,
  verify2faSchema
})
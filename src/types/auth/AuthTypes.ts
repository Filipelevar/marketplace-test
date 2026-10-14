import { z } from 'zod'

export const SESSION_TTL_MS = 30 * 60_000

const email = z.email('Informe um e-mail válido.').max(120)

export const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(64, 'A senha deve ter no máximo 64 caracteres.')
  .regex(/[A-Za-z]/, 'A senha deve conter pelo menos uma letra.')
  .regex(/\d/, 'A senha deve conter pelo menos um número.')

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'O nome de usuário deve ter pelo menos 3 caracteres.')
  .max(24, 'O nome de usuário deve ter no máximo 24 caracteres.')
  .regex(/^[a-z0-9._]+$/, 'Use apenas letras minúsculas, números, ponto ou sublinhado.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
})

export const registerSchema = z
  .object({
    username: usernameSchema,
    email,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

export type User = {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  ensName: string | null
  walletNickname: string | null
  createdAt: string
}

export type SessionResponse = {
  token: string
  expiresAt: string
  user: User
}

export type CurrentSession = {
  expiresAt: string
  user: User
}

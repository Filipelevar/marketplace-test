import { z } from 'zod'
import { passwordSchema, usernameSchema } from '@/types/auth/AuthTypes'

export const AVATAR_MAX_BYTES = 200 * 1024
export const AVATAR_SIZE_PX = 256

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe um nome de exibição com pelo menos 2 caracteres.').max(60),
  username: usernameSchema,
  email: z.email('Informe um e-mail válido.').max(120),
  ensName: z
    .string()
    .trim()
    .max(32)
    .regex(/^[a-z0-9-]*$/, 'Use apenas letras minúsculas, números e hífen.')
    .optional()
    .or(z.literal('')),
  walletNickname: z.string().trim().max(40, 'Use no máximo 40 caracteres.').optional().or(z.literal('')),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ['newPassword'],
    message: 'A nova senha deve ser diferente da atual.',
  })

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>

export const avatarUploadSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Envie uma imagem PNG, JPEG ou WebP.')
    .refine((value) => Math.ceil(((value.length - value.indexOf(',') - 1) * 3) / 4) <= AVATAR_MAX_BYTES, {
      message: 'A imagem deve ter no máximo 200 KB após o processamento.',
    }),
})

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>

import { z } from 'zod'

export function safeRedirect(value: string | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

export const authSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .catch(undefined)
    .transform((value) => (value ? safeRedirect(value) : undefined)),
  motivo: z.enum(['expirada']).optional().catch(undefined),
})

export type AuthSearch = z.infer<typeof authSearchSchema>

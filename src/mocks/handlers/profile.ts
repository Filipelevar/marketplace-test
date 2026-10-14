import { http, HttpResponse } from 'msw'
import { avatarUploadSchema, passwordChangeSchema, profileUpdateSchema } from '@/types/profile/ProfileTypes'
import { authenticate, createSalt, hashPassword, toPublicUser, verifyPassword } from '@/mocks/auth'
import { apiError, readJson, validationError } from '@/mocks/http'
import { commit, getDb } from '@/mocks/store/db'

export const profileHandlers = [
  http.get('/api/profile', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    return HttpResponse.json(toPublicUser(auth.user))
  }),

  http.patch('/api/profile', async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const parsed = profileUpdateSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const email = parsed.data.email.toLowerCase()
    const username = parsed.data.username.toLowerCase()
    const others = Object.values(getDb().users).filter((user) => user.id !== auth.user.id)
    const fieldErrors: Record<string, string> = {}
    if (others.some((user) => user.email === email)) fieldErrors.email = 'Já existe uma conta com este e-mail.'
    if (others.some((user) => user.username === username)) fieldErrors.username = 'Este nome de usuário já está em uso.'
    if (Object.keys(fieldErrors).length > 0) return apiError('CONFLICT', 'Alguns dados já estão em uso.', fieldErrors)

    commit(() => {
      Object.assign(auth.user, {
        displayName: parsed.data.displayName,
        username,
        email,
        ensName: parsed.data.ensName || null,
        walletNickname: parsed.data.walletNickname || null,
      })
    })
    return HttpResponse.json(toPublicUser(auth.user))
  }),

  http.put('/api/profile/avatar', async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const parsed = avatarUploadSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)
    commit(() => {
      auth.user.avatarUrl = parsed.data.dataUrl
    })
    return HttpResponse.json(toPublicUser(auth.user))
  }),

  http.delete('/api/profile/avatar', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    commit(() => {
      auth.user.avatarUrl = null
    })
    return HttpResponse.json(toPublicUser(auth.user))
  }),

  http.post('/api/profile/password', async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const parsed = passwordChangeSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    if (!(await verifyPassword(auth.user, parsed.data.currentPassword))) {
      return apiError('VALIDATION_ERROR', 'Não foi possível alterar a senha.', { currentPassword: 'Senha atual incorreta.' })
    }
    const passwordSalt = createSalt()
    const passwordHash = await hashPassword(parsed.data.newPassword, passwordSalt)
    commit(() => {
      auth.user.passwordSalt = passwordSalt
      auth.user.passwordHash = passwordHash
    })
    return new HttpResponse(null, { status: 204 })
  }),
]

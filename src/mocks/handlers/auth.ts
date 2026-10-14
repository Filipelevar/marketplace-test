import { http, HttpResponse } from 'msw'
import { loginSchema, registerSchema, type CurrentSession } from '@/types/auth/AuthTypes'
import { authenticate, bearerToken, createSalt, hashPassword, startSession, toPublicUser, verifyPassword } from '@/mocks/auth'
import type { UserRecord } from '@/mocks/fixtures/users'
import { apiError, readJson, validationError } from '@/mocks/http'
import { commit, getDb } from '@/mocks/store/db'

function findByEmail(email: string) {
  return Object.values(getDb().users).find((user) => user.email === email.toLowerCase())
}

function findByUsername(username: string) {
  return Object.values(getDb().users).find((user) => user.username === username.toLowerCase())
}

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    const parsed = registerSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const { username, email, password } = parsed.data
    const fieldErrors: Record<string, string> = {}
    if (findByEmail(email)) fieldErrors.email = 'Já existe uma conta com este e-mail.'
    if (findByUsername(username)) fieldErrors.username = 'Este nome de usuário já está em uso.'
    if (Object.keys(fieldErrors).length > 0) {
      return apiError('CONFLICT', 'Não foi possível criar a conta com estes dados.', fieldErrors)
    }

    const passwordSalt = createSalt()
    const user: UserRecord = {
      id: `user-${crypto.randomUUID()}`,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      displayName: username,
      avatarUrl: null,
      ensName: null,
      walletNickname: null,
      createdAt: new Date().toISOString(),
      passwordSalt,
      passwordHash: await hashPassword(password, passwordSalt),
    }
    commit((state) => {
      state.users[user.id] = user
    })
    return HttpResponse.json(startSession(user), { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const parsed = loginSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const user = findByEmail(parsed.data.email)
    if (!user || !(await verifyPassword(user, parsed.data.password))) {
      return apiError('UNAUTHORIZED', 'E-mail ou senha incorretos.')
    }
    return HttpResponse.json(startSession(user))
  }),

  http.get('/api/auth/session', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const body: CurrentSession = { expiresAt: auth.expiresAt, user: toPublicUser(auth.user) }
    return HttpResponse.json(body)
  }),

  http.post('/api/auth/logout', ({ request }) => {
    const token = bearerToken(request)
    if (token) {
      commit((state) => {
        delete state.sessions[token]
      })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]

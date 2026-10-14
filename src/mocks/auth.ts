import { SESSION_TTL_MS, type SessionResponse, type User } from '@/types/auth/AuthTypes'
import type { UserRecord } from '@/mocks/fixtures/users'
import { apiError } from '@/mocks/http'
import { commit, getDb } from '@/mocks/store/db'

const PBKDF2_ITERATIONS = 100_000
const KEY_LENGTH_BITS = 256

function toHex(buffer: ArrayBuffer | Uint8Array) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  return bytes
}

export async function hashPassword(password: string, saltHex: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    KEY_LENGTH_BITS,
  )
  return toHex(bits)
}

export function createSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)))
}

export async function verifyPassword(user: UserRecord, password: string) {
  return (await hashPassword(password, user.passwordSalt)) === user.passwordHash
}

export function toPublicUser(record: UserRecord): User {
  return {
    id: record.id,
    username: record.username,
    email: record.email,
    displayName: record.displayName,
    avatarUrl: record.avatarUrl,
    ensName: record.ensName,
    walletNickname: record.walletNickname,
    createdAt: record.createdAt,
  }
}

export function startSession(user: UserRecord): SessionResponse {
  const token = `kurio_${crypto.randomUUID().replaceAll('-', '')}`
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  commit((state) => {
    state.sessions[token] = { userId: user.id, expiresAt }
  })
  return { token, expiresAt, user: toPublicUser(user) }
}

export function bearerToken(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

type AuthResult = { ok: true; user: UserRecord; token: string; expiresAt: string } | { ok: false; response: Response }

export function authenticate(request: Request): AuthResult {
  const token = bearerToken(request)
  if (!token) return { ok: false, response: apiError('UNAUTHORIZED', 'Entre na sua conta para continuar.') }

  const { sessions, users } = getDb()
  const session = sessions[token]
  const user = session ? users[session.userId] : undefined
  if (!session || !user) return { ok: false, response: apiError('UNAUTHORIZED', 'Sessão inválida. Entre novamente.') }

  if (Date.parse(session.expiresAt) <= Date.now()) {
    commit((state) => {
      delete state.sessions[token]
    })
    return { ok: false, response: apiError('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.') }
  }

  return { ok: true, user, token, expiresAt: session.expiresAt }
}

type RequesterResult = { ok: true; user: UserRecord | null } | { ok: false; response: Response }

export function identifyRequester(request: Request): RequesterResult {
  if (!bearerToken(request)) return { ok: true, user: null }
  const auth = authenticate(request)
  return auth.ok ? { ok: true, user: auth.user } : auth
}

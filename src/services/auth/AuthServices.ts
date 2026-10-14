import type { GenericAbortSignal } from 'axios'
import type { CurrentSession, LoginInput, RegisterInput, SessionResponse } from '@/types/auth/AuthTypes'
import { API } from '@/services/api'

export async function getSession(signal?: GenericAbortSignal) {
  const { data } = await API.get<CurrentSession>('/auth/session', { signal })
  return data
}

export async function login(input: LoginInput) {
  const { data } = await API.post<SessionResponse>('/auth/login', input)
  return data
}

export async function register(input: RegisterInput) {
  const { data } = await API.post<SessionResponse>('/auth/register', input)
  return data
}

export async function logout() {
  await API.post('/auth/logout')
}

import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { CurrentSession, LoginInput, RegisterInput, SessionResponse, User } from '@/contracts/auth'
import type { Cart } from '@/contracts/cart'
import { http } from '@/lib/http'
import { clearGuestCartId, readGuestCartId } from '@/features/cart/cart-id-storage'
import { cartKeys } from '@/features/cart/keys'
import { clearPrivateData } from './private-data'
import { clearStoredSession, useStoredSession, writeStoredSession } from './session-storage'

export const sessionKeys = {
  current: (token: string) => ['session', token] as const,
}

export function sessionQuery(token: string) {
  return queryOptions({
    queryKey: sessionKeys.current(token),
    queryFn: async ({ signal }) => {
      const { data } = await http.get<CurrentSession>('/auth/session', { signal })
      return data
    },
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export type SessionState =
  | { status: 'anonymous'; user: null }
  | { status: 'loading'; user: null }
  | { status: 'authenticated'; user: User }

export function useSession(): SessionState {
  const stored = useStoredSession()
  const query = useQuery({ ...sessionQuery(stored?.token ?? ''), enabled: Boolean(stored) })
  if (!stored) return { status: 'anonymous', user: null }
  if (query.data) return { status: 'authenticated', user: query.data.user }
  if (query.isError) return { status: 'anonymous', user: null }
  return { status: 'loading', user: null }
}

async function completeSignIn(queryClient: QueryClient, session: SessionResponse) {
  clearPrivateData(queryClient)
  writeStoredSession({ token: session.token, expiresAt: session.expiresAt })
  queryClient.setQueryData(sessionKeys.current(session.token), { expiresAt: session.expiresAt, user: session.user })

  if (readGuestCartId()) {
    try {
      const { data } = await http.post<Cart>('/cart/merge')
      queryClient.setQueryData(cartKeys.owner(session.user.id), data)
      clearGuestCartId()
    } catch {
      return
    }
  }
}

export function signOutLocally(queryClient: QueryClient) {
  clearStoredSession()
  clearPrivateData(queryClient)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: LoginInput) => (await http.post<SessionResponse>('/auth/login', input)).data,
    onSuccess: (session) => completeSignIn(queryClient, session),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: RegisterInput) => (await http.post<SessionResponse>('/auth/register', input)).data,
    onSuccess: (session) => completeSignIn(queryClient, session),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await http.post('/auth/logout').catch(() => undefined)
    },
    onSettled: () => signOutLocally(queryClient),
  })
}

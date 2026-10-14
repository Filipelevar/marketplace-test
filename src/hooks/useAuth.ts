import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { SessionResponse, User } from '@/types/auth/AuthTypes'
import { getSession, login, logout, register } from '@/services/auth/AuthServices'
import { mergeGuestCart } from '@/services/cart/CartServices'
import { clearGuestCartId, readGuestCartId } from '@/stores/guest-cart-store'
import { clearCheckoutStorage } from '@/stores/checkout-store'
import { clearStoredSession, useStoredSession, writeStoredSession } from '@/stores/session-store'
import { clearPrivateData } from '@/utils/PrivateDataUtils'
import { cartKeys, sessionKeys } from '@/hooks/queryKeys'

export function sessionQuery(token: string) {
  return queryOptions({
    queryKey: sessionKeys.current(token),
    queryFn: ({ signal }) => getSession(signal),
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
      const cart = await mergeGuestCart()
      queryClient.setQueryData(cartKeys.owner(session.user.id), cart)
      clearGuestCartId()
    } catch {
      return
    }
  }
}

export function signOutLocally(queryClient: QueryClient) {
  clearStoredSession()
  clearCheckoutStorage()
  clearPrivateData(queryClient)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => completeSignIn(queryClient, session),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (session) => completeSignIn(queryClient, session),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => logout().catch(() => undefined),
    onSettled: () => signOutLocally(queryClient),
  })
}

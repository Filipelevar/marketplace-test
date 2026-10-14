import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { CurrentSession, User } from '@/types/auth/AuthTypes'
import { changePassword, removeAvatar, updateProfile, uploadAvatar } from '@/services/profile/ProfileServices'
import { readStoredSession } from '@/stores/session-store'
import { sessionKeys } from '@/hooks/queryKeys'

function setSessionUser(queryClient: QueryClient, user: User) {
  const token = readStoredSession()?.token
  if (!token) return
  queryClient.setQueryData<CurrentSession>(sessionKeys.current(token), (current) => (current ? { ...current, user } : current))
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => setSessionUser(queryClient, user),
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (user) => setSessionUser(queryClient, user),
  })
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => removeAvatar(),
    onSuccess: (user) => setSessionUser(queryClient, user),
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}

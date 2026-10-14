import type { User } from '@/types/auth/AuthTypes'
import type { PasswordChangeInput, ProfileUpdateInput } from '@/types/profile/ProfileTypes'
import { API } from '@/services/api'

export async function updateProfile(input: ProfileUpdateInput) {
  const { data } = await API.patch<User>('/profile', input)
  return data
}

export async function uploadAvatar(dataUrl: string) {
  const { data } = await API.put<User>('/profile/avatar', { dataUrl })
  return data
}

export async function removeAvatar() {
  const { data } = await API.delete<User>('/profile/avatar')
  return data
}

export async function changePassword(input: PasswordChangeInput) {
  await API.post('/profile/password', input)
}

import type { User } from '@/types/auth/AuthTypes'

export type UserRecord = User & {
  passwordHash: string
  passwordSalt: string
}

export const FIXTURE_PASSWORD_HINT = 'Kurio@2026'

export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: 'user-ana',
      username: 'ana.coleciona',
      email: 'ana@kurio.dev',
      displayName: 'Ana Colecionadora',
      avatarUrl: null,
      ensName: 'ana',
      walletNickname: 'Carteira principal',
      createdAt: '2026-08-01T12:00:00.000Z',
      passwordSalt: '6b7572696f2d616e612d73616c742d31',
      passwordHash: 'ea346dd36f7cd8679abdc70b965b89eb277cc2f71c2bd4a685a7c4cfcb91a38c',
    },
    {
      id: 'user-bruno',
      username: 'bruno.nft',
      email: 'bruno@kurio.dev',
      displayName: 'Bruno Ribeiro',
      avatarUrl: null,
      ensName: null,
      walletNickname: null,
      createdAt: '2026-08-15T12:00:00.000Z',
      passwordSalt: '6b7572696f2d6272756e6f2d73616c74',
      passwordHash: '3bf5c1a4ffb2bfa47d97c53eaff4a148270e22cf4c4b064202c488416a45bdfc',
    },
  ]
}

export const FIXTURE_FAVORITES: Record<string, string[]> = {
  'user-ana': ['emerald-ape-042', 'ivory-baron-088'],
  'user-bruno': ['golden-beat-207'],
}

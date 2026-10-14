import type { Wallet } from '@/types/wallets/WalletTypes'

export type WalletRecord = Wallet & { userId: string }

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: 'wallet-ana-primary',
      userId: 'user-ana',
      label: 'Principal',
      address: '0xA91F3c7B2d4E5f60718293a4B5c6D7e8F9a0E82C',
      network: 'ethereum',
      provider: 'metamask',
      ensName: 'ana.eth',
      role: 'primary',
      createdAt: '2026-08-02T12:00:00.000Z',
      updatedAt: '2026-08-02T12:00:00.000Z',
    },
    {
      id: 'wallet-ana-secondary',
      userId: 'user-ana',
      label: 'Reserva',
      address: '0x5bA7c3D9e1F2a4B6c8D0e2F4a6B8c0D2e4F6a8B0',
      network: 'polygon',
      provider: 'coinbase',
      ensName: 'nova.kurio.eth',
      role: 'secondary',
      createdAt: '2026-08-05T12:00:00.000Z',
      updatedAt: '2026-08-05T12:00:00.000Z',
    },
  ]
}

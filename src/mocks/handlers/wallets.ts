import { http, HttpResponse } from 'msw'
import { connectWalletSchema, walletInputSchema, type Wallet, type WalletConnection } from '@/contracts/wallet'
import { authenticate } from '@/mocks/auth'
import type { WalletRecord } from '@/mocks/fixtures/wallets'
import { apiError, readJson, validationError } from '@/mocks/http'
import { commit, getDb } from '@/mocks/store/db'

function toPublicWallet(record: WalletRecord): Wallet {
  return {
    id: record.id,
    label: record.label,
    address: record.address,
    network: record.network,
    provider: record.provider,
    ensName: record.ensName,
    role: record.role,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function walletsOf(userId: string) {
  return Object.values(getDb().wallets)
    .filter((wallet) => wallet.userId === userId)
    .sort((a, b) => (a.role === b.role ? a.createdAt.localeCompare(b.createdAt) : a.role === 'primary' ? -1 : 1))
}

function demoteOtherPrimaries(userId: string, keepId: string) {
  for (const wallet of Object.values(getDb().wallets)) {
    if (wallet.userId === userId && wallet.id !== keepId && wallet.role === 'primary') wallet.role = 'secondary'
  }
}

export const walletHandlers = [
  http.get('/api/wallets', ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    return HttpResponse.json(walletsOf(auth.user.id).map(toPublicWallet))
  }),

  http.post('/api/wallets', async ({ request }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const parsed = walletInputSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const existing = walletsOf(auth.user.id)
    if (existing.some((wallet) => wallet.address.toLowerCase() === parsed.data.address.toLowerCase())) {
      return apiError('CONFLICT', 'Esta carteira já está cadastrada.', { address: 'Esta carteira já está cadastrada.' })
    }
    if (existing.length >= 2) {
      return apiError('CONFLICT', 'Você já cadastrou uma carteira principal e uma secundária. Edite uma delas.')
    }

    const now = new Date().toISOString()
    const wallet: WalletRecord = {
      id: `wallet-${crypto.randomUUID().slice(0, 8)}`,
      userId: auth.user.id,
      label: parsed.data.label,
      address: parsed.data.address,
      network: parsed.data.network,
      provider: parsed.data.provider,
      ensName: parsed.data.ensName || null,
      role: existing.length === 0 ? 'primary' : parsed.data.role,
      createdAt: now,
      updatedAt: now,
    }
    commit((state) => {
      state.wallets[wallet.id] = wallet
      if (wallet.role === 'primary') demoteOtherPrimaries(auth.user.id, wallet.id)
    })
    return HttpResponse.json(toPublicWallet(wallet), { status: 201 })
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const wallet = getDb().wallets[String(params.id)]
    if (!wallet || wallet.userId !== auth.user.id) return apiError('NOT_FOUND', 'Carteira não encontrada.')

    const parsed = walletInputSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)
    const duplicate = walletsOf(auth.user.id).some(
      (other) => other.id !== wallet.id && other.address.toLowerCase() === parsed.data.address.toLowerCase(),
    )
    if (duplicate) return apiError('CONFLICT', 'Esta carteira já está cadastrada.', { address: 'Esta carteira já está cadastrada.' })

    commit(() => {
      Object.assign(wallet, {
        label: parsed.data.label,
        address: parsed.data.address,
        network: parsed.data.network,
        provider: parsed.data.provider,
        ensName: parsed.data.ensName || null,
        role: parsed.data.role,
        updatedAt: new Date().toISOString(),
      })
      if (wallet.role === 'primary') demoteOtherPrimaries(auth.user.id, wallet.id)
    })
    return HttpResponse.json(toPublicWallet(wallet))
  }),

  http.post('/api/wallets/:id/connect', async ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    const wallet = getDb().wallets[String(params.id)]
    if (!wallet || wallet.userId !== auth.user.id) return apiError('NOT_FOUND', 'Carteira não encontrada.')
    const parsed = connectWalletSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const connection: WalletConnection = {
      id: `conn-${crypto.randomUUID().slice(0, 8)}`,
      walletId: wallet.id,
      provider: parsed.data.provider,
      network: parsed.data.network,
      address: wallet.address,
      connectedAt: new Date().toISOString(),
    }
    commit((state) => {
      for (const [id, existing] of Object.entries(state.walletConnections)) {
        if (existing.userId === auth.user.id) delete state.walletConnections[id]
      }
      state.walletConnections[connection.id] = { ...connection, userId: auth.user.id }
    })
    return HttpResponse.json(connection, { status: 201 })
  }),

  http.delete('/api/wallet-connections/:id', ({ request, params }) => {
    const auth = authenticate(request)
    if (!auth.ok) return auth.response
    commit((state) => {
      const connection = state.walletConnections[String(params.id)]
      if (connection?.userId === auth.user.id) delete state.walletConnections[String(params.id)]
    })
    return new HttpResponse(null, { status: 204 })
  }),
]

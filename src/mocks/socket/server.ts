import { ws, type WebSocketHandlerConnection } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { eventId, type NftUpdatedEvent, type OrderUpdatedEvent } from '@/types/realtime/RealtimeTypes'
import { REALTIME_EVENTS } from '@/enums/RealtimeEnums'
import type { NftRecord } from '@/mocks/fixtures/nfts'
import { getDb, type OrderRecord } from '@/mocks/store/db'
import { onNftChanged, onOrderChanged } from '@/mocks/store/events'

type MockSocketConnection = {
  id: string
  userId: string | null
  emit: (event: string, ...data: unknown[]) => void
  close: () => void
}

const HEARTBEAT_INTERVAL_MS = 25_000
const ENGINE_IO_PING = '2'
const SOCKET_IO_CONNECT_PREFIX = '40'

const connections = new Map<string, MockSocketConnection>()

const socketLink = ws.link(import.meta.env.VITE_SOCKET_URL)

function readAuthToken(rawPacket: string): string | null {
  try {
    const payload: unknown = JSON.parse(rawPacket.slice(SOCKET_IO_CONNECT_PREFIX.length) || '{}')
    if (typeof payload === 'object' && payload !== null && 'token' in payload && typeof payload.token === 'string') {
      return payload.token
    }
  } catch {
    return null
  }
  return null
}

function userIdForToken(token: string | null): string | null {
  if (!token) return null
  const session = getDb().sessions[token]
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null
  return session.userId
}

function handleConnection(connection: WebSocketHandlerConnection) {
  const { client } = connection
  const io = toSocketIo(connection)
  const heartbeat = setInterval(() => client.send(ENGINE_IO_PING), HEARTBEAT_INTERVAL_MS)

  client.addEventListener('message', (event) => {
    if (typeof event.data !== 'string' || !event.data.startsWith(SOCKET_IO_CONNECT_PREFIX)) return
    connections.set(client.id, {
      id: client.id,
      userId: userIdForToken(readAuthToken(event.data)),
      emit: (name, ...data) => io.client.emit(name, ...data),
      close: () => client.close(),
    })
  })

  client.addEventListener('close', () => {
    clearInterval(heartbeat)
    connections.delete(client.id)
  })
}

export const socketHandlers = [socketLink.addEventListener('connection', handleConnection)]

export function emitToClients(event: string, payload: unknown, options: { userId?: string } = {}) {
  let delivered = 0
  for (const connection of connections.values()) {
    if (options.userId !== undefined && connection.userId !== options.userId) continue
    connection.emit(event, payload)
    delivered += 1
  }
  return delivered
}

export function dropAllConnections() {
  for (const connection of connections.values()) connection.close()
}

function nftUpdatedEvent(nft: NftRecord): NftUpdatedEvent {
  return {
    id: eventId('nft', nft.id, nft.version),
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    data: {
      priceEth: nft.priceEth,
      available: nft.available,
      editions: nft.editions.map((edition) => ({ id: edition.id, available: edition.available })),
    },
  }
}

function orderUpdatedEvent(order: OrderRecord): OrderUpdatedEvent {
  return {
    id: eventId('order', order.id, order.version),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    data: {
      status: order.status,
      failureReason: order.failureReason,
      transactionHash: order.transactionHash,
      blockNumber: order.blockNumber,
      confirmedAt: order.confirmedAt,
      updatedAt: order.updatedAt,
    },
  }
}

onNftChanged((nft) => emitToClients(REALTIME_EVENTS.nftUpdated, nftUpdatedEvent(nft)))
onOrderChanged((order) => emitToClients(REALTIME_EVENTS.orderUpdated, orderUpdatedEvent(order), { userId: order.userId }))

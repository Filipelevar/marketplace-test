import { ws, type WebSocketHandlerConnection } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'

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
  const payload: unknown = JSON.parse(rawPacket.slice(SOCKET_IO_CONNECT_PREFIX.length) || '{}')
  if (typeof payload === 'object' && payload !== null && 'token' in payload && typeof payload.token === 'string') {
    return payload.token
  }
  return null
}

function handleConnection(connection: WebSocketHandlerConnection) {
  const { client } = connection
  const io = toSocketIo(connection)
  const heartbeat = setInterval(() => client.send(ENGINE_IO_PING), HEARTBEAT_INTERVAL_MS)

  client.addEventListener('message', (event) => {
    if (typeof event.data !== 'string' || !event.data.startsWith(SOCKET_IO_CONNECT_PREFIX)) return
    connections.set(client.id, {
      id: client.id,
      userId: readAuthToken(event.data),
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

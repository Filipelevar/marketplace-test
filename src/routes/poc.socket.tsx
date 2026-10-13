import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createSocket } from '@/lib/socket'

// Temporary proof of concept for the Socket.IO mock transport. Removed once real features use the socket.
export const Route = createFileRoute('/poc/socket')({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: SocketPocPage,
})

type Status = 'idle' | 'connected' | 'disconnected'

function SocketPocPage() {
  const { token } = Route.useSearch()
  const [status, setStatus] = useState<Status>('idle')
  const [connectCount, setConnectCount] = useState(0)
  const [events, setEvents] = useState<string[]>([])

  useEffect(() => {
    const socket = createSocket(token ?? null)
    socket.on('connect', () => {
      setStatus('connected')
      setConnectCount((count) => count + 1)
    })
    socket.on('disconnect', () => setStatus('disconnected'))
    socket.on('poc.ping', (payload: unknown) => setEvents((list) => [...list, JSON.stringify(payload)]))
    socket.connect()

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [token])

  return (
    <main className="space-y-2 p-6 font-mono text-sm">
      <h1 className="text-lg font-semibold">Socket.IO POC</h1>
      <p>
        token: <span data-testid="token">{token ?? 'none'}</span>
      </p>
      <p>
        status: <span data-testid="status">{status}</span>
      </p>
      <p>
        connects: <span data-testid="connect-count">{connectCount}</span>
      </p>
      <ul data-testid="events">
        {events.map((event, index) => (
          <li key={index}>{event}</li>
        ))}
      </ul>
    </main>
  )
}

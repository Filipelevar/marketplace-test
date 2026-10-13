import { http, HttpResponse } from 'msw'
import { dropAllConnections, emitToClients, socketHandlers } from '@/mocks/socket/server'

type EmitRequestBody = {
  event: string
  payload: unknown
  userId?: string
}

export const handlers = [
  ...socketHandlers,

  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),

  // Dev/test control plane: lets Playwright and the demo trigger server-side socket events
  http.post<never, EmitRequestBody>('/api/__dev/socket/emit', async ({ request }) => {
    const { event, payload, userId } = await request.json()
    const delivered = emitToClients(event, payload, { userId })
    return HttpResponse.json({ delivered })
  }),
  http.post('/api/__dev/socket/drop', () => {
    dropAllConnections()
    return new HttpResponse(null, { status: 204 })
  }),

  // Must stay last: unknown API routes get a real 404 instead of falling through to the SPA's index.html
  http.all('/api/*', ({ request }) =>
    HttpResponse.json(
      { code: 'NOT_FOUND', message: `No route for ${request.method} ${new URL(request.url).pathname}` },
      { status: 404 },
    ),
  ),
]

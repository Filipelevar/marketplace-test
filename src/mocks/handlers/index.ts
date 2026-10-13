import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),

  // Must stay last: unknown API routes get a real 404 instead of falling through to the SPA's index.html
  http.all('/api/*', ({ request }) =>
    HttpResponse.json(
      { code: 'NOT_FOUND', message: `No route for ${request.method} ${new URL(request.url).pathname}` },
      { status: 404 },
    ),
  ),
]

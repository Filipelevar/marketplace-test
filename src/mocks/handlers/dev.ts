import { http, HttpResponse } from 'msw'
import { isScenarioId, readMockConfig, SCENARIOS, writeMockConfig, type MockConfig } from '@/mocks/scenarios'
import { readJson } from '@/mocks/http'
import { commit, resetDb } from '@/mocks/store/db'
import { queueFailure } from './network'
import { dropAllConnections, emitToClients } from '@/mocks/socket/server'

type EmitRequestBody = {
  event: string
  payload: unknown
  userId?: string
}

export const devHandlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),

  http.get('/api/__dev/config', () => HttpResponse.json({ ...readMockConfig(), scenarios: SCENARIOS })),

  http.post('/api/__dev/reset', async ({ request }) => {
    const body = await readJson(request)
    const current = readMockConfig()
    const next: MockConfig = {
      scenario:
        typeof body === 'object' && body !== null && 'scenario' in body && isScenarioId(body.scenario)
          ? body.scenario
          : current.scenario,
      latency:
        typeof body === 'object' && body !== null && 'latency' in body && body.latency === 'off' ? 'off' : current.latency,
    }
    writeMockConfig(next)
    resetDb(next.scenario)
    return HttpResponse.json(next)
  }),

  http.post('/api/__dev/fail-next', async ({ request }) => {
    const body = await readJson(request)
    if (typeof body !== 'object' || body === null || !('method' in body) || !('path' in body)) {
      return HttpResponse.json({ message: 'Informe method e path.' }, { status: 400 })
    }
    const status = 'status' in body && (typeof body.status === 'number' || body.status === 'network') ? body.status : 503
    const delayMs = 'delayMs' in body && typeof body.delayMs === 'number' ? body.delayMs : undefined
    queueFailure({ method: String(body.method), path: String(body.path), status, delayMs })
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/__dev/session/expire', () => {
    commit((state) => {
      for (const session of Object.values(state.sessions)) session.expiresAt = new Date(0).toISOString()
    })
    return new HttpResponse(null, { status: 204 })
  }),

  http.post<never, EmitRequestBody>('/api/__dev/socket/emit', async ({ request }) => {
    const { event, payload, userId } = await request.json()
    const delivered = emitToClients(event, payload, { userId })
    return HttpResponse.json({ delivered })
  }),

  http.post('/api/__dev/socket/drop', () => {
    dropAllConnections()
    return new HttpResponse(null, { status: 204 })
  }),
]

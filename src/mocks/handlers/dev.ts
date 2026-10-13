import { http, HttpResponse } from 'msw'
import { isScenarioId, readMockConfig, SCENARIOS, writeMockConfig, type MockConfig } from '@/mocks/scenarios'
import { readJson } from '@/mocks/http'
import { resetDb } from '@/mocks/store/db'
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

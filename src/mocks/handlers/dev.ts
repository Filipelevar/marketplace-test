import { http, HttpResponse } from 'msw'
import { isScenarioId, readMockConfig, SCENARIOS, writeMockConfig, type MockConfig } from '@/mocks/scenarios'
import { isApiErrorCode, readJson } from '@/mocks/http'
import { commit, resetDb } from '@/mocks/store/db'
import { armDropNextOrderResponse, setNextOrderOutcome } from '@/mocks/store/checkout'
import { toDetail, updateNft } from '@/mocks/store/nfts'
import { isEthString } from '@/utils/EthUtils'
import { queueFailure } from '@/mocks/handlers/network'
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
    const code = 'code' in body && isApiErrorCode(body.code) ? body.code : undefined
    const message = 'message' in body && typeof body.message === 'string' ? body.message : undefined
    queueFailure({ method: String(body.method), path: String(body.path), status, delayMs, code, message })
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/__dev/nfts/:id', async ({ params, request }) => {
    const body = await readJson(request)
    if (typeof body !== 'object' || body === null) return HttpResponse.json({ message: 'Corpo inválido.' }, { status: 400 })
    const priceEth = 'priceEth' in body && typeof body.priceEth === 'string' && isEthString(body.priceEth) ? body.priceEth : undefined
    const editionAvailability =
      'editionAvailability' in body && typeof body.editionAvailability === 'object' && body.editionAvailability !== null
        ? Object.fromEntries(
            Object.entries(body.editionAvailability).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
          )
        : undefined
    const nft = updateNft(String(params.id), { priceEth, editionAvailability })
    if (!nft) return HttpResponse.json({ message: 'NFT não encontrado.' }, { status: 404 })
    return HttpResponse.json(toDetail(nft))
  }),

  http.post('/api/__dev/orders/next-outcome', async ({ request }) => {
    const body = await readJson(request)
    const outcome = typeof body === 'object' && body !== null && 'outcome' in body ? body.outcome : null
    if (outcome !== 'confirmed' && outcome !== 'declined') {
      return HttpResponse.json({ message: 'Use confirmed ou declined.' }, { status: 400 })
    }
    setNextOrderOutcome(outcome)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/__dev/orders/drop-next-response', () => {
    armDropNextOrderResponse()
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

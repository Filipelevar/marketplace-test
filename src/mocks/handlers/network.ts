import { delay, http, HttpResponse } from 'msw'
import { apiError } from '@/mocks/http'
import { readMockConfig } from '@/mocks/scenarios'

const DEV_PREFIX = '/api/__dev/'

function createSeededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = createSeededRandom(20261013)
let requestCount = 0

type QueuedFailure = { method: string; path: string; status: 'network' | number; delayMs?: number }
const queuedFailures: QueuedFailure[] = []

export function queueFailure(failure: QueuedFailure) {
  queuedFailures.push({ ...failure, method: failure.method.toUpperCase() })
}

function takeQueuedFailure(request: Request) {
  const pathname = new URL(request.url).pathname
  const index = queuedFailures.findIndex(
    (failure) => failure.method === request.method && pathname.startsWith(failure.path),
  )
  return index === -1 ? null : (queuedFailures.splice(index, 1)[0] ?? null)
}

function latencyFor(scenario: string, sequence: number): number {
  if (scenario === 'lento') return 2000 + Math.round(random() * 2000)
  if (scenario === 'fora-de-ordem') return 1600 - (sequence % 4) * 450
  return 150 + Math.round(random() * 450)
}

export const networkHandlers = [
  http.all('/api/*', async ({ request }) => {
    if (new URL(request.url).pathname.startsWith(DEV_PREFIX)) return

    const { scenario, latency } = readMockConfig()
    requestCount += 1
    const sequence = requestCount

    if (latency === 'realistic' || scenario === 'lento' || scenario === 'fora-de-ordem') {
      await delay(latencyFor(scenario, sequence))
    }

    const queued = takeQueuedFailure(request)
    if (queued?.delayMs) await delay(queued.delayMs)
    if (queued?.status === 'network') return HttpResponse.error()
    if (queued) {
      return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Serviço temporariamente indisponível. Tente novamente.' }, { status: queued.status })
    }

    if (scenario === 'offline') return HttpResponse.error()
    if (scenario === 'erro-servidor') {
      return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Erro interno no servidor.' }, { status: 500 })
    }
    if (scenario === 'instavel' && sequence % 3 === 0) {
      return apiError('UNAVAILABLE', 'Serviço temporariamente indisponível. Tente novamente.')
    }
  }),
]

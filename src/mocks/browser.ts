import { setupWorker } from 'msw/browser'
import { isScenarioId, readMockConfig, writeMockConfig } from '@/mocks/scenarios'
import { resetDb } from '@/mocks/store/db'
import { handlers } from '@/mocks/handlers'

export const worker = setupWorker(...handlers)

function applyScenarioFromUrl() {
  const url = new URL(window.location.href)
  const scenario = url.searchParams.get('cenario')
  const latency = url.searchParams.get('latencia')
  if (!isScenarioId(scenario) && latency === null) return

  const current = readMockConfig()
  const next = {
    scenario: isScenarioId(scenario) ? scenario : current.scenario,
    latency: latency === 'off' ? ('off' as const) : ('realistic' as const),
  }
  writeMockConfig(next)
  resetDb(next.scenario)

  url.searchParams.delete('cenario')
  url.searchParams.delete('latencia')
  window.history.replaceState(window.history.state, '', url)
}

export async function startMockWorker() {
  applyScenarioFromUrl()
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
}

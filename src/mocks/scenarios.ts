export const SCENARIOS = {
  padrao: 'Dados completos e latência realista',
  vazio: 'Catálogo sem NFTs',
  lento: 'Todas as respostas levam de 2 a 4 segundos',
  'fora-de-ordem': 'Requisições seguintes respondem antes das anteriores',
  instavel: 'Uma em cada três requisições falha com 503',
  offline: 'Todas as requisições falham por indisponibilidade de conexão',
  'erro-servidor': 'Todas as requisições respondem 500',
} as const

export type ScenarioId = keyof typeof SCENARIOS
export type LatencyMode = 'realistic' | 'off'

export type MockConfig = {
  scenario: ScenarioId
  latency: LatencyMode
}

const CONFIG_KEY = 'kurio:mock-config'
const DEFAULT_CONFIG: MockConfig = { scenario: 'padrao', latency: 'realistic' }

export function isScenarioId(value: unknown): value is ScenarioId {
  return typeof value === 'string' && value in SCENARIOS
}

export function readMockConfig(): MockConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return DEFAULT_CONFIG
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_CONFIG
    const scenario = 'scenario' in parsed && isScenarioId(parsed.scenario) ? parsed.scenario : DEFAULT_CONFIG.scenario
    const latency = 'latency' in parsed && parsed.latency === 'off' ? 'off' : 'realistic'
    return { scenario, latency }
  } catch {
    return DEFAULT_CONFIG
  }
}

export function writeMockConfig(config: MockConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

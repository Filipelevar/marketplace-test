import { createNftFixtures, type NftRecord } from '@/mocks/fixtures/nfts'
import { readMockConfig, type ScenarioId } from '@/mocks/scenarios'

const STORAGE_KEY = 'kurio:mock-db'
const SCHEMA_VERSION = 3

export type MockDb = {
  schemaVersion: number
  scenario: ScenarioId
  nfts: Record<string, NftRecord>
}

function seed(scenario: ScenarioId): MockDb {
  const nfts = scenario === 'vazio' ? [] : createNftFixtures()
  return {
    schemaVersion: SCHEMA_VERSION,
    scenario,
    nfts: Object.fromEntries(nfts.map((nft) => [nft.id, nft])),
  }
}

function isMockDb(value: unknown, scenario: ScenarioId): value is MockDb {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === SCHEMA_VERSION &&
    'scenario' in value &&
    value.scenario === scenario
  )
}

function load(): MockDb {
  const { scenario } = readMockConfig()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (isMockDb(parsed, scenario)) return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
  const fresh = seed(scenario)
  persist(fresh)
  return fresh
}

function persist(state: MockDb) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

let db: MockDb | null = null

export function getDb(): MockDb {
  db ??= load()
  return db
}

export function commit(mutate: (state: MockDb) => void) {
  const state = getDb()
  mutate(state)
  persist(state)
}

export function resetDb(scenario: ScenarioId) {
  db = seed(scenario)
  persist(db)
}

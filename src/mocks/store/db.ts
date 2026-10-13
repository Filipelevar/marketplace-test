import { createNftFixtures, type NftRecord } from '@/mocks/fixtures/nfts'
import { createUserFixtures, FIXTURE_FAVORITES, type UserRecord } from '@/mocks/fixtures/users'
import { readMockConfig, type ScenarioId } from '@/mocks/scenarios'

const STORAGE_KEY = 'kurio:mock-db'
const SCHEMA_VERSION = 4

export type SessionRecord = {
  userId: string
  expiresAt: string
}

export type CartLineRecord = {
  nftId: string
  editionId: string
  quantity: number
}

export type CartRecord = {
  id: string
  ownerUserId: string | null
  items: CartLineRecord[]
  couponCode: string | null
  updatedAt: string
}

export type MockDb = {
  schemaVersion: number
  scenario: ScenarioId
  nfts: Record<string, NftRecord>
  users: Record<string, UserRecord>
  sessions: Record<string, SessionRecord>
  favorites: Record<string, string[]>
  carts: Record<string, CartRecord>
}

function seed(scenario: ScenarioId): MockDb {
  const nfts = scenario === 'vazio' ? [] : createNftFixtures()
  const users = createUserFixtures()
  return {
    schemaVersion: SCHEMA_VERSION,
    scenario,
    nfts: Object.fromEntries(nfts.map((nft) => [nft.id, nft])),
    users: Object.fromEntries(users.map((user) => [user.id, user])),
    sessions: {},
    favorites: scenario === 'vazio' ? {} : structuredClone(FIXTURE_FAVORITES),
    carts: {},
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

export function commit<T>(mutate: (state: MockDb) => T): T {
  const state = getDb()
  const result = mutate(state)
  persist(state)
  return result
}

export function resetDb(scenario: ScenarioId) {
  db = seed(scenario)
  persist(db)
}

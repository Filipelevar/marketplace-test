import type { Page } from '@playwright/test'

type Scenario = 'padrao' | 'vazio' | 'lento' | 'fora-de-ordem' | 'instavel' | 'offline' | 'erro-servidor'
type Latency = 'realistic' | 'off'

export async function useScenario(page: Page, scenario: Scenario = 'padrao', latency: Latency = 'off') {
  await page.addInitScript(
    ([nextScenario, nextLatency]) => {
      const key = 'kurio:mock-config'
      if (!sessionStorage.getItem('kurio:test-config-applied')) {
        localStorage.setItem(key, JSON.stringify({ scenario: nextScenario, latency: nextLatency }))
        sessionStorage.setItem('kurio:test-config-applied', 'true')
      }
    },
    [scenario, latency] as const,
  )
}

export async function switchScenario(page: Page, scenario: Scenario, latency: Latency = 'off') {
  await page.evaluate(
    async ([nextScenario, nextLatency]) => {
      await fetch('/api/__dev/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: nextScenario, latency: nextLatency }),
      })
    },
    [scenario, latency] as const,
  )
}

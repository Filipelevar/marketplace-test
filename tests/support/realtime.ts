import type { Page } from '@playwright/test'

export async function patchNft(page: Page, nftId: string, patch: { priceEth?: string; editionAvailability?: Record<string, number> }) {
  await page.evaluate(
    async ({ nftId, patch }) => {
      await fetch(`/api/__dev/nfts/${nftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
    },
    { nftId, patch },
  )
}

export async function emitSocketEvent(page: Page, event: string, payload: unknown, userId?: string) {
  return page.evaluate(
    async (body) => {
      const res = await fetch('/api/__dev/socket/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return ((await res.json()) as { delivered: number }).delivered
    },
    { event, payload, userId },
  )
}

export async function dropSocket(page: Page) {
  await page.evaluate(() => fetch('/api/__dev/socket/drop', { method: 'POST' }))
}

export function nftEvent(nftId: string, version: number, priceEth: string, available = 50) {
  return {
    id: `nft:${nftId}:v${version}`,
    type: 'nft.updated',
    resource: { type: 'nft', id: nftId },
    version,
    occurredAt: new Date().toISOString(),
    data: { priceEth, available, editions: [] },
  }
}

import { z } from 'zod'

const ethString = z.string().regex(/^\d+(\.\d{1,18})?$/)

const baseEvent = {
  id: z.string().min(1),
  version: z.number().int().positive(),
  occurredAt: z.string(),
}

export const nftUpdatedEventSchema = z.object({
  ...baseEvent,
  type: z.literal('nft.updated'),
  resource: z.object({ type: z.literal('nft'), id: z.string().min(1) }),
  data: z.object({
    priceEth: ethString,
    available: z.number().int().min(0),
    editions: z.array(z.object({ id: z.string(), available: z.number().int().min(0) })),
  }),
})

export const orderUpdatedEventSchema = z.object({
  ...baseEvent,
  type: z.literal('order.updated'),
  resource: z.object({ type: z.literal('order'), id: z.string().min(1) }),
  data: z.object({
    status: z.enum(['pending', 'confirmed', 'declined']),
    failureReason: z.string().nullable(),
    transactionHash: z.string().nullable(),
    blockNumber: z.number().int().nullable(),
    confirmedAt: z.string().nullable(),
    updatedAt: z.string(),
  }),
})

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>
export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export const REALTIME_EVENTS = {
  nftUpdated: 'nft.updated',
  orderUpdated: 'order.updated',
} as const

export function eventId(resourceType: 'nft' | 'order', resourceId: string, version: number) {
  return `${resourceType}:${resourceId}:v${version}`
}

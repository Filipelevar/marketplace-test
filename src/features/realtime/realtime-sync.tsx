import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CurrentSession } from '@/contracts/auth'
import { nftUpdatedEventSchema, orderUpdatedEventSchema, REALTIME_EVENTS } from '@/contracts/realtime'
import { displayEth } from '@/lib/eth'
import { sessionKeys } from '@/features/auth/api'
import { useStoredSession } from '@/features/auth/session-storage'
import { publishRealtimeNotice } from './bus'
import { addCartNotice, clearCartNotices } from './cart-notices'
import { applyNftUpdate, applyOrderUpdate, createEventGate, reconcileWithRest } from './cache-sync'
import { setRealtimeStatus } from './status'

export function RealtimeSync() {
  const queryClient = useQueryClient()
  const token = useStoredSession()?.token ?? null

  useEffect(() => {
    let disposed = false
    let teardown: (() => void) | null = null
    setRealtimeStatus('connecting')

    void import('@/lib/socket').then(({ createSocket }) => {
      if (disposed) return
      const socket = createSocket(token)
      const accept = createEventGate()
      let connectedBefore = false

      socket.on('connect', () => {
        setRealtimeStatus('connected')
        if (connectedBefore) {
          reconcileWithRest(queryClient)
          publishRealtimeNotice({ type: 'reconciled' })
        }
        connectedBefore = true
      })

      socket.on('disconnect', () => setRealtimeStatus('disconnected'))

      socket.on(REALTIME_EVENTS.nftUpdated, (payload: unknown) => {
        const parsed = nftUpdatedEventSchema.safeParse(payload)
        if (!parsed.success || !accept(parsed.data)) return
        const cartNotice = applyNftUpdate(queryClient, parsed.data)
        if (cartNotice) addCartNotice(cartNotice)
        publishRealtimeNotice({ type: 'nft-updated', nftId: parsed.data.resource.id, cartNotice })
        if (cartNotice && cartNotice.previousPriceEth !== cartNotice.priceEth) {
          toast.info(`O preço de ${cartNotice.name} no seu carrinho mudou para ${displayEth(cartNotice.priceEth)}.`)
        }
      })

      socket.on(REALTIME_EVENTS.orderUpdated, (payload: unknown) => {
        const parsed = orderUpdatedEventSchema.safeParse(payload)
        if (!parsed.success || !token || !accept(parsed.data)) return
        const userId = queryClient.getQueryData<CurrentSession>(sessionKeys.current(token))?.user.id
        if (userId) applyOrderUpdate(queryClient, userId, parsed.data)
      })

      socket.connect()
      teardown = () => {
        socket.removeAllListeners()
        socket.disconnect()
      }
    })

    return () => {
      clearCartNotices()
      disposed = true
      teardown?.()
      setRealtimeStatus('idle')
    }
  }, [token, queryClient])

  return null
}

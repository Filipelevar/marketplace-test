import { z } from 'zod'
import { collectorSchema } from '@/contracts/checkout'

export const checkoutFormSchema = collectorSchema.extend({
  walletId: z.string('Selecione uma carteira.').min(1, 'Selecione uma carteira.'),
  network: z.enum(['ethereum', 'polygon', 'solana'], 'Selecione uma rede.'),
  provider: z.enum(['metamask', 'walletconnect', 'coinbase'], 'Selecione como conectar a carteira.'),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

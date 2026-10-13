import { z } from 'zod'

export const newsletterSubscriptionSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
})

export type NewsletterSubscriptionInput = z.infer<typeof newsletterSubscriptionSchema>

export type NewsletterSubscription = {
  email: string
  subscribedAt: string
}

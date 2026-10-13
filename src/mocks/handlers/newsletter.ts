import { http, HttpResponse } from 'msw'
import { newsletterSubscriptionSchema, type NewsletterSubscription } from '@/contracts/newsletter'
import { readJson, validationError } from '@/mocks/http'

const subscribers = new Set<string>()

export const newsletterHandlers = [
  http.post('/api/newsletter', async ({ request }) => {
    const parsed = newsletterSubscriptionSchema.safeParse(await readJson(request))
    if (!parsed.success) return validationError(parsed.error)

    const email = parsed.data.email.toLowerCase()
    subscribers.add(email)
    const body: NewsletterSubscription = { email, subscribedAt: new Date().toISOString() }
    return HttpResponse.json(body, { status: 201 })
  }),
]

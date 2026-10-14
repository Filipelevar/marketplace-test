import type { NewsletterSubscription, NewsletterSubscriptionInput } from '@/types/newsletter/NewsletterTypes'
import { API } from '@/services/api'

export async function subscribeToNewsletter(input: NewsletterSubscriptionInput) {
  const { data } = await API.post<NewsletterSubscription>('/newsletter', input)
  return data
}

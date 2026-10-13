import { useMutation } from '@tanstack/react-query'
import type { NewsletterSubscription, NewsletterSubscriptionInput } from '@/contracts/newsletter'
import { http } from '@/lib/http'

export async function subscribeToNewsletter(input: NewsletterSubscriptionInput) {
  const { data } = await http.post<NewsletterSubscription>('/newsletter', input)
  return data
}

export function useSubscribeToNewsletter() {
  return useMutation({ mutationFn: subscribeToNewsletter })
}

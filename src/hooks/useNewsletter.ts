import { useMutation } from '@tanstack/react-query'
import { subscribeToNewsletter } from '@/services/newsletter/NewsletterServices'

export function useSubscribeToNewsletter() {
  return useMutation({ mutationFn: subscribeToNewsletter })
}

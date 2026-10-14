import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { AddCartItemInput } from '@/types/cart/CartTypes'
import { getApiErrorMessage } from '@/utils/ApiErrorUtils'
import { useAddToCart } from '@/hooks/useCart'

export function useAddToCartWithFeedback() {
  const addToCart = useAddToCart()
  const navigate = useNavigate()

  function add(input: AddCartItemInput & { name: string }, options: { goToCart?: boolean } = {}) {
    const { name, ...item } = input
    addToCart.mutate(item, {
      onSuccess: () => {
        if (options.goToCart) {
          void navigate({ to: '/carrinho' })
          return
        }
        toast.success(`${name} adicionado ao carrinho.`, {
          action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/carrinho' }) },
        })
      },
      onError: (error) => toast.error('Não foi possível adicionar ao carrinho.', { description: getApiErrorMessage(error) }),
    })
  }

  return { add, isPending: addToCart.isPending }
}

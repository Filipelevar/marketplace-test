import { useCart } from '@/hooks/useCart'

export function useCartCount() {
  const { data } = useCart()
  return data?.itemCount ?? 0
}

export function cartLabel(count: number) {
  if (count === 0) return 'Carrinho vazio'
  return count === 1 ? 'Carrinho com 1 item' : `Carrinho com ${count} itens`
}

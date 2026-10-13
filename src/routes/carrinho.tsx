import { useIsMutating, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { AlertTriangle, ChevronLeft, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { nftListQuery } from '@/features/catalog/api'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'
import { useCart } from '@/features/cart/api'
import { CartChangeNotices } from '@/features/cart/components/cart-change-notices'
import { CartItemCard, CartItemRow } from '@/features/cart/components/cart-items'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { getApiErrorMessage } from '@/lib/api-error'

export const Route = createFileRoute('/carrinho')({
  head: () => ({ meta: [{ title: 'Carrinho | Kurio' }] }),
  component: CartPage,
})

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação" className="hidden lg:block">
      <ol className="flex gap-1.5 text-[15px] font-bold">
        <li>
          <Link to="/" className="hover:text-highlight">
            Início
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link to="/" hash="catalogo" className="hover:text-highlight">
            Mercado
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li aria-current="page">Carrinho</li>
      </ol>
    </nav>
  )
}

function CartSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-8 lg:flex-row lg:gap-20">
      <span role="status" className="sr-only">
        Carregando carrinho
      </span>
      <div className="flex flex-1 flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[86px] w-full" />
        ))}
      </div>
      <div className="flex w-full flex-col gap-4 lg:w-[332px]">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  )
}

function CartPage() {
  const router = useRouter()
  const { data: cart, isPending, isError, error, refetch } = useCart()
  const isUpdating = useIsMutating({ mutationKey: ['cart'] }) > 0
  const recommendations = useQuery(nftListQuery({ tab: 'em-alta' }))

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      <section aria-labelledby="carrinho-titulo" className="page-container flex flex-col gap-6 pt-6 lg:pt-8">
        <Breadcrumb />
        <div className="flex items-center gap-4 lg:hidden">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.history.back()}
            className="grid size-[37px] place-items-center rounded-full bg-card"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
        </div>
        <h1 id="carrinho-titulo" className="text-2xl font-bold max-lg:-mt-[3.25rem] max-lg:text-center lg:sr-only">
          Carrinho de NFTs
        </h1>

        <CartChangeNotices />

        {isPending ? (
          <CartSkeleton />
        ) : isError ? (
          <div role="alert" className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
            <AlertTriangle aria-hidden className="size-10 text-coral" />
            <p className="font-bold">Não foi possível carregar o carrinho.</p>
            <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
            <Button onClick={() => void refetch()}>Tentar novamente</Button>
          </div>
        ) : cart.items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 bg-card px-6 py-16 text-center">
            <ShoppingCart aria-hidden className="size-10 text-primary" />
            <p className="text-lg font-bold">Seu carrinho está vazio</p>
            <p className="text-sm text-muted-foreground">Explore o mercado e adicione NFTs para continuar.</p>
            <Button asChild>
              <Link to="/" hash="catalogo">
                Explorar o mercado
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-20">
            <div className="min-w-0 flex-1">
              <table className="hidden w-full border-separate border-spacing-y-3 lg:table">
                <caption className="sr-only">Itens no carrinho</caption>
                <thead>
                  <tr className="text-left text-base font-bold">
                    <th scope="col" className="border-b border-primary/30 px-3 pb-3">
                      NFTs
                    </th>
                    <th scope="col" className="border-b border-primary/30 px-3 pb-3">
                      Preço
                    </th>
                    <th scope="col" className="border-b border-primary/30 px-3 pb-3">
                      Edições
                    </th>
                    <th scope="col" className="border-b border-primary/30 px-3 pb-3">
                      Total
                    </th>
                    <th scope="col" className="border-b border-primary/30 px-3 pb-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
              <ul className="flex flex-col gap-4 lg:hidden" aria-label="Itens no carrinho">
                {cart.items.map((item) => (
                  <CartItemCard key={item.id} item={item} />
                ))}
              </ul>
            </div>
            <div className="w-full rounded-t-[30px] bg-card p-6 lg:w-[332px] lg:rounded-none lg:bg-transparent lg:p-0">
              <CartSummary cart={cart} isUpdating={isUpdating} />
            </div>
          </div>
        )}
      </section>

      <div className="page-container">
        <NftCarousel
          title="Colecionadores também viram"
          items={recommendations.data?.items}
          isPending={recommendations.isPending}
        />
      </div>
    </div>
  )
}


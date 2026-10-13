import { createFileRoute } from '@tanstack/react-router'
import { catalogSearchSchema } from '@/contracts/nft'
import { CatalogMobileBar } from '@/features/catalog/components/catalog-mobile-bar'
import { CatalogSection } from '@/features/catalog/components/catalog-section'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { BlogSection } from '@/features/home/blog-section'
import { PromoSection } from '@/features/home/promo-section'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-24">
      <CatalogMobileBar />
      <HomeHero />
      <CatalogSection />
      <PromoSection />
      <BlogSection />
    </div>
  )
}

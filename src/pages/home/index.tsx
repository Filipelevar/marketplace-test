import { CatalogMobileBar } from '@/pages/home/catalog/mobile-bar'
import { CatalogSection } from '@/pages/home/catalog'
import { HomeHero } from '@/pages/home/hero'
import { BlogSection } from '@/pages/home/blog'
import { PromoSection } from '@/pages/home/promos'

export function HomePage() {
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

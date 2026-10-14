import { createFileRoute } from '@tanstack/react-router'
import { catalogSearchSchema } from '@/types/nfts/NftTypes'
import { HomePage } from '@/pages/home'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})

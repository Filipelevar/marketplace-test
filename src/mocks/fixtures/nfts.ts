import { type NftDetail, type NftEdition, type NftImage } from '@/types/nfts/NftTypes'
import { COLLECTIONS, NETWORKS } from '@/enums/NftEnums'

export type Artwork = 'emerald' | 'nomad' | 'golden' | 'baron'

export type NftRecord = NftDetail & {
  isNewRelease: boolean
  trending: boolean
}

type FixtureRow = [name: string, artwork: Artwork, priceEth: string, compareAtPriceEth: string | null, rare: boolean]

const ROWS: FixtureRow[] = [
  ['Emerald Ape #042', 'emerald', '1.19', null, false],
  ['Sage Nomad #009', 'nomad', '1.69', null, false],
  ['Neon Vessel #552', 'baron', '1.99', '2.29', true],
  ['Cosmic Bloom #118', 'nomad', '1.29', null, false],
  ['Violet Nomad #314', 'nomad', '1.39', null, false],
  ['Ivory Baron #088', 'baron', '1.79', null, false],
  ['Golden Beat #207', 'golden', '0.99', null, false],
  ['Golden Frequency #071', 'golden', '0.59', null, false],
  ['Golden Signal #160', 'golden', '0.39', null, false],
  ['Jade Monarch #233', 'emerald', '2.45', null, true],
  ['Velvet Drifter #017', 'nomad', '0.85', null, false],
  ['Onyx Regent #401', 'baron', '3.10', '3.60', false],
  ['Amber Pulse #126', 'golden', '0.72', null, false],
  ['Forest Lens #064', 'emerald', '1.05', null, false],
  ['Lilac Wanderer #293', 'nomad', '0.48', null, false],
  ['Midnight Count #512', 'baron', '2.80', null, true],
  ['Solar Rhythm #189', 'golden', '1.15', null, false],
  ['Verdant Crown #377', 'emerald', '4.20', null, true],
  ['Dusk Pilgrim #058', 'nomad', '0.66', null, false],
  ['Graphite Duke #146', 'baron', '1.92', null, false],
  ['Honey Tempo #222', 'golden', '0.31', null, false],
  ['Emerald Echo #305', 'emerald', '1.58', '1.90', false],
  ['Misty Rover #411', 'nomad', '0.92', null, false],
  ['Obsidian Lord #099', 'baron', '5.75', null, true],
  ['Brass Melody #364', 'golden', '0.54', null, false],
  ['Pine Sovereign #271', 'emerald', '2.12', null, false],
  ['Plum Voyager #036', 'nomad', '0.77', null, false],
  ['Slate Marquis #448', 'baron', '1.36', null, false],
  ['Citrine Groove #115', 'golden', '0.44', null, false],
  ['Moss Guardian #520', 'emerald', '3.33', null, false],
  ['Heather Nomad #082', 'nomad', '1.01', null, false],
  ['Charcoal Earl #267', 'baron', '2.64', null, false],
  ['Gilded Chorus #339', 'golden', '0.89', null, false],
  ['Clover Sage #154', 'emerald', '0.02', null, false],
  ['Indigo Seeker #476', 'nomad', '1.24', null, false],
  ['Ebony Baron #600', 'baron', '12.30', null, true],
]

const ARTWORK_ALT: Record<Artwork, string> = {
  emerald: 'Ilustração de um macaco de óculos redondos e jaqueta universitária verde',
  nomad: 'Ilustração de um gorila de chapéu bucket verde e moletom roxo',
  golden: 'Ilustração de um orangotango dourado com fones de ouvido verdes',
  baron: 'Ilustração de um chimpanzé de cabelo escuro, gola alta verde e blazer claro',
}

const ATTRIBUTES: Record<Artwork, string[]> = {
  emerald: ['Óculos', 'Esmeralda', 'Jaqueta'],
  nomad: ['Chapéu bucket', 'Moletom', 'Barba grisalha'],
  golden: ['Fones', 'Pelagem dourada', 'Jaqueta bomber'],
  baron: ['Blazer', 'Gola alta', 'Brinco'],
}

const COLLECTION_NAME: Record<Artwork, string> = {
  emerald: 'Kurio Apes',
  nomad: 'Nomad Society',
  golden: 'Golden Frequencies',
  baron: 'Baron Club',
}

const CREATORS = ['Nova Sato', 'Iris Calloway', 'Teo Marques', 'Ama Okafor']

const FALLBACK_REVIEW = { author: 'lumen.eth', rating: 5, comment: 'Acabamento impecável e procedência clara. A arte em alta resolução vale cada detalhe.' }

const REVIEW_TEMPLATES = [
  FALLBACK_REVIEW,
  { author: 'colecionador_br', rating: 5, comment: 'Entrega rápida na carteira e atributos bem documentados nos metadados.' },
  { author: 'mira.art', rating: 4, comment: 'Peça linda, só gostaria de mais edições abertas disponíveis.' },
  { author: 'pixelnomade', rating: 5, comment: 'Uma das melhores obras da coleção. A comunidade dos holders é muito ativa.' },
]
const REFERENCE_DATE = Date.UTC(2026, 9, 1, 12, 0, 0)
const DAY_MS = 86_400_000
export const SOLD_OUT_NFT_ID = 'obsidian-lord-099'

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function image(artwork: Artwork, name: string): NftImage {
  return { thumb: `/nfts/${artwork}-480.webp`, full: `/nfts/${artwork}-960.webp`, alt: `${name}: ${ARTWORK_ALT[artwork]}` }
}

function editions(index: number, soldOut: boolean): NftEdition[] {
  const left = (value: number) => (soldOut ? 0 : value)
  return [
    { id: '1-1', label: '1/1', supply: 1, available: left(index % 4 === 0 ? 0 : 1) },
    { id: '1-10', label: '1/10', supply: 10, available: left((index * 3) % 11) },
    { id: '1-50', label: '1/50', supply: 50, available: left(50 - ((index * 7) % 50)) },
    { id: 'aberta', label: 'Aberta', supply: null, available: left(100) },
  ]
}

function buildRecord([name, artwork, priceEth, compareAtPriceEth, rare]: FixtureRow, index: number): NftRecord {
  const id = slugify(name)
  const tokenNumber = name.split('#')[1] ?? String(index)
  const collection = COLLECTIONS[index % COLLECTIONS.length]?.slug ?? 'arte-digital'
  const network = NETWORKS[(index + Math.floor(index / COLLECTIONS.length)) % NETWORKS.length]?.slug ?? 'ethereum'
  const networkLabel = NETWORKS.find((item) => item.slug === network)?.label ?? 'Ethereum'
  const creator = CREATORS[index % CREATORS.length] ?? 'Nova Sato'
  const nftEditions = editions(index, id === SOLD_OUT_NFT_ID)
  const main = image(artwork, name)

  return {
    id,
    name,
    tokenId: `#0${tokenNumber}`,
    collection,
    network,
    image: main,
    priceEth,
    compareAtPriceEth,
    rarity: rare ? 'raro' : null,
    available: nftEditions.reduce((total, edition) => total + edition.available, 0),
    listedAt: new Date(REFERENCE_DATE - index * DAY_MS).toISOString(),
    version: 1,
    description: `Um colecionável digital finalizado à mão da coleção ${COLLECTION_NAME[artwork]}, verificado na ${networkLabel}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${name} é uma obra digital finalizada à mão da coleção ${COLLECTION_NAME[artwork]}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabel}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator} recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    collectionName: COLLECTION_NAME[artwork],
    creator,
    contractAddress: `0x7A42${tokenNumber.padStart(4, '0')}C3D19E8`,
    royaltyPercent: 5,
    attributes: rare ? [...ATTRIBUTES[artwork], 'Raro'] : ATTRIBUTES[artwork],
    rating: { average: (48 - (index % 5)) / 10, count: 19 + ((index * 5) % 40) },
    reviews: [0, 1, 2].map((offset) => {
      const template = REVIEW_TEMPLATES[(index + offset) % REVIEW_TEMPLATES.length] ?? FALLBACK_REVIEW
      return {
        id: `${id}-review-${offset + 1}`,
        author: template.author,
        rating: template.rating,
        comment: template.comment,
        createdAt: new Date(REFERENCE_DATE - (index + offset * 3 + 1) * DAY_MS).toISOString(),
      }
    }),
    editions: nftEditions,
    gallery: [main, main, main, main],
    isNewRelease: index < 12,
    trending: index % 3 === 1 || rare,
  }
}

export function createNftFixtures(): NftRecord[] {
  return ROWS.map(buildRecord)
}

export const HERO_NFT_IDS = ['emerald-ape-042', 'sage-nomad-009', 'ivory-baron-088']
export const SPOTLIGHT_NFT_ID = 'violet-nomad-314'

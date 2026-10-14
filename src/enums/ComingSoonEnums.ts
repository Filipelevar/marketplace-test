export const COMING_SOON_SECTIONS = {
  criadores: 'Criadores',
  aprenda: 'Aprenda',
  blog: 'Diário da Cunhagem',
  colecao: 'Minha coleção',
  atividade: 'Atividade',
  estudio: 'Estúdio do criador',
  ofertas: 'Ofertas',
  downloads: 'Arquivos baixados',
  suporte: 'Suporte',
  ajuda: 'Central de ajuda',
  'como-comprar': 'Como comprar NFTs',
  seguranca: 'Carteira e segurança',
  politica: 'Política do mercado',
  denunciar: 'Denunciar item',
  scanner: 'Leitor de QR code',
  'login-social': 'Login social',
} as const

export type ComingSoonSection = keyof typeof COMING_SOON_SECTIONS

export function isComingSoonSection(value: unknown): value is ComingSoonSection {
  return typeof value === 'string' && value in COMING_SOON_SECTIONS
}

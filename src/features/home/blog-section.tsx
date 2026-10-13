import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'

const POSTS = [
  {
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    date: '12 de setembro',
    readingTime: 6,
    image: '/nfts/baron-480.webp',
  },
  {
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    date: '13 de setembro',
    readingTime: 2,
    image: '/nfts/emerald-480.webp',
  },
  {
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    date: '15 de setembro',
    readingTime: 3,
    image: '/nfts/nomad-480.webp',
  },
  {
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    date: '15 de setembro',
    readingTime: 2,
    image: '/nfts/golden-480.webp',
  },
]

export function BlogSection() {
  return (
    <section aria-labelledby="blog-titulo" className="page-container flex flex-col gap-8">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="blog-titulo" className="text-2xl font-bold sm:text-[28px]">
          Diário da Cunhagem
        </h2>
        <p className="text-sm text-muted-foreground">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-card">
              <img
                src={post.image}
                alt=""
                width={480}
                height={480}
                loading="lazy"
                decoding="async"
                className="aspect-[3/2] w-full object-cover object-top"
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="text-xs text-muted-foreground">
                  {post.date} <span aria-hidden>|</span> Leitura de {post.readingTime} min
                </p>
                <h3 className="font-bold">{post.title}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{post.excerpt}</p>
                <Link
                  to="/em-breve"
                  search={{ secao: 'blog' }}
                  className="mt-auto flex w-fit items-center gap-1 pt-2 text-xs font-bold text-highlight hover:underline"
                >
                  Ler mais
                  <span className="sr-only">: {post.title}</span>
                  <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

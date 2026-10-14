import type { ReactNode } from 'react'
import { getRouteApi, Link, useRouter } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import googleLogo from '@/assets/brand/brand-google.svg'
import facebookLogo from '@/assets/brand/brand-facebook.svg'
import { safeRedirect, type AuthSearch } from '@/utils/RedirectUtils'
import { LoginForm } from '@/pages/auth/login-form'
import { RegisterForm } from '@/pages/auth/register-form'

type AuthMode = 'login' | 'register'

const loginRoute = getRouteApi('/entrar')
const registerRoute = getRouteApi('/cadastro')

function SocialButtons() {
  const notAvailable = () => toast.info('Login social não está disponível nesta demonstração.')
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-[13px]">
        <span className="h-px flex-1 bg-border" />
        Ou continue com
        <span className="h-px flex-1 bg-border" />
      </div>
      {[
        { label: 'Continuar com Google', logo: googleLogo },
        { label: 'Continuar com Facebook', logo: facebookLogo },
      ].map((provider) => (
        <button
          key={provider.label}
          type="button"
          onClick={notAvailable}
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-border text-[13px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <img src={provider.logo} alt="" width={20} height={20} className="size-5" />
          {provider.label}
        </button>
      ))}
    </div>
  )
}

function ModeTabs({ mode, search }: { mode: AuthMode; search: AuthSearch }) {
  const tabClass = (active: boolean) =>
    cn('transition-colors hover:text-highlight', active ? 'text-highlight' : 'text-foreground')
  return (
    <nav aria-label="Acesso à conta" className="flex items-center justify-center gap-2 text-xl">
      <Link to="/entrar" search={search} aria-current={mode === 'login' ? 'page' : undefined} className={tabClass(mode === 'login')}>
        Entrar
      </Link>
      <span aria-hidden className="h-6 w-px bg-primary" />
      <Link to="/cadastro" search={search} aria-current={mode === 'register' ? 'page' : undefined} className={tabClass(mode === 'register')}>
        Criar conta
      </Link>
    </nav>
  )
}

export function LoginPage() {
  const search = loginRoute.useSearch()
  return <AuthScreen mode="login" search={search} />
}

export function RegisterPage() {
  const search = registerRoute.useSearch()
  return <AuthScreen mode="register" search={search} />
}

function AuthScreen({ mode, search }: { mode: AuthMode; search: AuthSearch }) {
  const router = useRouter()
  const redirectTo = safeRedirect(search.redirect)

  function onAuthenticated() {
    router.history.replace(redirectTo)
  }

  const title = mode === 'login' ? 'Entrar' : 'Criar conta'
  const description =
    mode === 'login'
      ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
      : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'

  let content: ReactNode = <LoginForm onAuthenticated={onAuthenticated} />
  if (mode === 'register') content = <RegisterForm onAuthenticated={onAuthenticated} />

  return (
    <div className="relative isolate flex min-h-[calc(100dvh-6rem)] items-start justify-center lg:items-center lg:py-12">
      <div aria-hidden className="absolute inset-0 -z-10 hidden overflow-hidden lg:block">
        <img src="/nfts/emerald-960.webp" alt="" className="absolute top-0 right-[10%] h-full max-h-[540px] rounded-3xl object-cover opacity-40" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/40" />
      </div>

      <section
        aria-labelledby="auth-titulo"
        className="relative w-full max-w-[500px] px-6 pt-16 pb-10 lg:border-b-[10px] lg:border-primary lg:bg-card lg:px-20 lg:pt-14 lg:shadow-2xl"
      >
        <button
          type="button"
          aria-label="Fechar e voltar"
          onClick={() => router.history.push(redirectTo)}
          className="absolute top-4 right-4 hidden size-9 place-items-center text-primary hover:text-highlight lg:grid"
        >
          <X aria-hidden className="size-5" />
        </button>

        <p className="mb-16 text-center text-[32px] font-bold tracking-[0.1em] lg:hidden" aria-hidden>
          KURIO
        </p>
        <h1 id="auth-titulo" className="sr-only">
          {title}
        </h1>
        <div className="hidden lg:block">
          <ModeTabs mode={mode} search={search} />
        </div>
        <p aria-hidden className="mb-8 text-center text-xl font-bold lg:hidden">
          {title}
        </p>
        <p className="mt-6 mb-8 hidden text-center text-[13px] lg:block">{description}</p>

        {search.motivo === 'expirada' && (
          <p role="alert" className="mb-6 rounded-md border border-amber/50 bg-amber/10 px-4 py-3 text-sm text-amber">
            Sua sessão expirou. Entre novamente para continuar de onde parou.
          </p>
        )}

        <div className="flex flex-col gap-6">
          {content}
          <SocialButtons />
          <p className="text-center text-sm text-muted-foreground lg:hidden">
            {mode === 'login' ? (
              <>
                Novo na Kurio?{' '}
                <Link to="/cadastro" search={search} className="text-highlight underline-offset-4 hover:underline">
                  Crie uma conta
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <Link to="/entrar" search={search} className="text-highlight underline-offset-4 hover:underline">
                  Entrar
                </Link>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  )
}

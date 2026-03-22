import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/server'

// Cliente admin para leitura dos domínios configurados no banco
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Cache em memória para não bater no banco a cada request
let domainsCache: Record<string, string> | null = null
let domainsCacheAt: number = 0
const CACHE_TTL = 60 * 1000 // Atualiza a cada 1 minuto

async function getDomains(): Promise<Record<string, string>> {
  const now = Date.now()
  if (domainsCache && now - domainsCacheAt < CACHE_TTL) {
    return domainsCache
  }

  const { data } = await supabaseAdmin
    .from('platform_settings')
    .select('key, value')
    .in('key', ['domain_marketing', 'domain_app', 'domain_cardapio', 'domain_kds'])

  // Valores padrão caso o banco ainda não tenha sido configurado
  const domains: Record<string, string> = {
    domain_marketing: 'menuflow.com.br',
    domain_app:       'app.menuflow.com.br',
    domain_cardapio:  'cardapio.menuflow.com.br',
    domain_kds:       'cozinha.menuflow.com.br',
  }

  data?.forEach(item => {
    if (item.value) domains[item.key] = item.value
  })

  domainsCache = domains
  domainsCacheAt = now
  return domains
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Cliente SSR para autenticação via cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  // Remove a porta do hostname — útil em desenvolvimento local
  const hostname = request.headers.get('host')?.split(':')[0] || ''

  // Busca domínios configurados no banco (com cache de 1 minuto)
  const domains = await getDomains()

  // ─────────────────────────────────────────────────
  // 1. DOMÍNIO DE MARKETING — acesso público total
  // ─────────────────────────────────────────────────
  if (hostname === domains.domain_marketing) {
    // Deixa o Next.js rotear para app/(marketing)/
    return response
  }

  // ─────────────────────────────────────────────────
  // 2. DOMÍNIO DO CARDÁPIO PÚBLICO — acesso público
  // Suporta dois formatos:
  //   cardapio.menuflow.com.br/burguerflow
  //   burguerflow.menuflow.com.br (subdomínio por slug)
  // ─────────────────────────────────────────────────
  if (hostname === domains.domain_cardapio) {
    // Formato: cardapio.menuflow.com.br/[slug]
    // Next.js roteia normalmente para app/(cardapio)/
    return response
  }

  const rootDomain = domains.domain_marketing
  if (
    hostname.endsWith(`.${rootDomain}`) &&
    hostname !== domains.domain_app &&
    hostname !== domains.domain_kds &&
    hostname !== domains.domain_cardapio
  ) {
    // Formato: [slug].menuflow.com.br
    // Extrai o slug e reescreve internamente para a rota do cardápio
    const slug = hostname.replace(`.${rootDomain}`, '')
    if (slug && slug !== 'www') {
      const url = request.nextUrl.clone()
      url.pathname = `/cardapio/${slug}${pathname === '/' ? '' : pathname}`
      return NextResponse.rewrite(url)
    }
  }

  // ─────────────────────────────────────────────────
  // 3. DOMÍNIO DO KDS — exige autenticação
  // ─────────────────────────────────────────────────
  if (hostname === domains.domain_kds) {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()
      url.host = domains.domain_app
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const userRole = user.app_metadata?.role as UserRole | undefined
    const allowedRoles: UserRole[] = ['super_admin', 'restaurant_admin', 'kitchen']

    if (!userRole || !allowedRoles.includes(userRole)) {
      const url = request.nextUrl.clone()
      url.host = domains.domain_app
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }

    // Redireciona a raiz para a tela do KDS
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/cozinha'
      return NextResponse.rewrite(url)
    }

    return response
  }

  // ─────────────────────────────────────────────────
  // 4. DOMÍNIO DO APP — painel admin e super-admin
  // ─────────────────────────────────────────────────

  // Rotas públicas do app — não exigem autenticação
  const publicPaths = ['/login', '/cadastro', '/unauthorized', '/demo', '/precos']
  const isPublicPath =
    publicPaths.some(p => pathname === p || pathname.startsWith(p)) ||
    pathname.startsWith('/api/')

  if (isPublicPath) {
    return response
  }

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Lê o role do JWT (app_metadata) — zero latência, sem query ao banco
  const userRole = user.app_metadata?.role as UserRole | undefined

  if (!userRole) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const unauthorized = request.nextUrl.clone()
  unauthorized.pathname = '/unauthorized'

  // Guards de rota por role
  if (pathname.startsWith('/super-admin') && userRole !== 'super_admin') {
    return NextResponse.redirect(unauthorized)
  }

  if (
    pathname.startsWith('/admin') &&
    userRole !== 'super_admin' &&
    userRole !== 'restaurant_admin'
  ) {
    return NextResponse.redirect(unauthorized)
  }

  if (pathname.startsWith('/cozinha')) {
    const allowed: UserRole[] = ['super_admin', 'restaurant_admin', 'kitchen']
    if (!allowed.includes(userRole)) {
      return NextResponse.redirect(unauthorized)
    }
  }

  // ─────────────────────────────────────────────────
  // 5. REDIRECIONAMENTO AUTOMÁTICO PÓS-LOGIN
  // Usuário logado acessa a raiz → vai para o painel correto
  // ─────────────────────────────────────────────────
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    if (userRole === 'super_admin') {
      url.pathname = '/super-admin/dashboard'
    } else if (userRole === 'restaurant_admin') {
      url.pathname = '/admin/dashboard'
    } else if (userRole === 'kitchen') {
      url.pathname = '/cozinha'
    }
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname
  const publicPaths = ['/login', '/cadastro', '/unauthorized']
  const isPublic = publicPaths.some(p => pathname.startsWith(p)) || pathname.startsWith('/api/')

  if (isPublic) return response

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const role = user.app_metadata?.role

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = role === 'super_admin' ? '/super-admin/dashboard'
      : role === 'restaurant_admin' ? '/admin/dashboard'
      : '/cozinha'
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/super-admin') && role !== 'super_admin') {
    const url = request.nextUrl.clone()
    url.pathname = '/unauthorized'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

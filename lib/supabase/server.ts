import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type UserRole = 'super_admin' | 'restaurant_admin' | 'kitchen'

export interface UserProfile {
  id: string
  restaurant_id: string | null
  full_name: string
  role: UserRole
}

// cookies() é assíncrono no Next.js 15 — sempre usar await
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // set pode falhar em Server Components — o middleware atualiza nesses casos
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Tratado pelo middleware
          }
        },
      },
    }
  )
}

export async function getServerUser() {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return { user: null, profile: null }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('[getServerUser] Perfil não encontrado para user:', user.id, profileError)
    return { user, profile: null }
  }

  return { user, profile: profile as UserProfile }
}

'use client';
'use client';
export const runtime = 'edge';
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UtensilsCrossed } from 'lucide-react'
import { MenuManager } from './components/menu-manager'

export default async function CardapioSuperAdminPage({ params }: { params: { id: string } }) {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  // ✅ supabaseAdmin para ignorar RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: restaurant },
    { data: categories },
    { data: products },
  ] = await Promise.all([
    supabaseAdmin.from('restaurants').select('id, name, slug').eq('id', params.id).single(),
    supabaseAdmin.from('categories').select('*').eq('restaurant_id', params.id).order('sort_order', { ascending: true }),
    supabaseAdmin.from('products').select('*').eq('restaurant_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!restaurant) notFound()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/super-admin/restaurantes/${restaurant.id}`} title="Voltar para detalhes">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cardápio</h1>
            <p className="text-sm text-muted-foreground">Gerenciando produtos de <b>{restaurant.name}</b></p>
          </div>
        </div>
      </div>

      <MenuManager
        restaurantId={restaurant.id}
        categories={categories || []}
        products={products || []}
      />
    </div>
  )
}

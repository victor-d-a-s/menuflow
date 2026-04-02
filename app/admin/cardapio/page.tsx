export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UtensilsCrossed } from 'lucide-react'
import { CardapioManager } from './components/cardapio-manager'

export default async function CardapioPage() {
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'restaurant_admin' || !profile.restaurant_id) redirect('/unauthorized')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').eq('restaurant_id', profile.restaurant_id).order('sort_order'),
    supabase.from('products').select('*').eq('restaurant_id', profile.restaurant_id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cardápio</h1>
          <p className="text-muted-foreground">Gerencie categorias e produtos do seu cardápio.</p>
        </div>
      </div>

      <CardapioManager
        categories={categories || []}
        products={products || []}
      />
    </div>
  )
}

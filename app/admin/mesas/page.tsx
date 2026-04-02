export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Table2 } from 'lucide-react'
import { MesasManager } from './components/mesas-manager'

export default async function MesasPage() {
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'restaurant_admin' || !profile.restaurant_id) redirect('/unauthorized')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: tables }, { data: restaurant }] = await Promise.all([
    supabase.from('tables').select('*').eq('restaurant_id', profile.restaurant_id).order('name_or_number'),
    supabase.from('restaurants').select('slug, color_primary').eq('id', profile.restaurant_id).single(),
  ])

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
          <Table2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mesas & QR Code</h1>
          <p className="text-muted-foreground">Crie mesas e gere QR codes para seus clientes.</p>
        </div>
      </div>

      <MesasManager
        tables={tables || []}
        restaurantId={profile.restaurant_id}
        slug={restaurant?.slug || ''}
      />
    </div>
  )
}

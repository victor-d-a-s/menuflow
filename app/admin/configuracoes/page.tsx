export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings } from 'lucide-react'
import { ConfigForm } from './components/config-form'
export default async function ConfiguracoesPage() {
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'restaurant_admin' || !profile.restaurant_id) redirect('/unauthorized')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: restaurant } = await supabase.from('restaurants').select('name, slug, plan, plan_status, color_primary, delivery_enabled, table_enabled, trial_ends_at, payment_provider').eq('id', profile.restaurant_id).single()
  if (!restaurant) redirect('/unauthorized')
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-zinc-100 text-zinc-700 rounded-lg"><Settings className="w-6 h-6"/></div>
        <div><h1 className="text-3xl font-bold tracking-tight">Configurações</h1><p className="text-muted-foreground">Personalize seu restaurante.</p></div>
      </div>
      <ConfigForm restaurant={restaurant} />
    </div>
  )
}

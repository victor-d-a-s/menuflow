export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { PedidosClient } from './components/pedidos-client'
export default async function PedidosPage() {
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'restaurant_admin' || !profile.restaurant_id) redirect('/unauthorized')
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: orders } = await supabase.from('orders')
    .select('id, number, type, status, total, customer_name, customer_phone, notes, created_at, order_items(id, product_name, quantity, unit_price, notes)')
    .eq('restaurant_id', profile.restaurant_id).order('created_at', { ascending: false }).limit(50)
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><Receipt className="w-6 h-6" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">Gerencie pedidos em tempo real.</p>
        </div>
      </div>
      <PedidosClient initialOrders={orders||[]} restaurantId={profile.restaurant_id} />
    </div>
  )
}

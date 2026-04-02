export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt, DollarSign, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const fmt = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

const statusLabel: Record<string,string> = { pendente:'Pendente', pago:'Pago', preparando:'Preparando', pronto:'Pronto', entregue:'Entregue', cancelado:'Cancelado' }
const statusColor: Record<string,string> = { pendente:'bg-yellow-500/10 text-yellow-600', pago:'bg-blue-500/10 text-blue-600', preparando:'bg-orange-500/10 text-orange-600', pronto:'bg-green-500/10 text-green-600', entregue:'bg-emerald-500/10 text-emerald-600', cancelado:'bg-red-500/10 text-red-600' }

export default async function AdminDashboard() {
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'restaurant_admin' || !profile.restaurant_id) redirect('/unauthorized')

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const rid = profile.restaurant_id
  const today = new Date(); today.setHours(0,0,0,0)

  const [{ data: todayOrders }, { count: activeOrders }, { data: recentOrders }] = await Promise.all([
    supabase.from('orders').select('total, status').eq('restaurant_id', rid).gte('created_at', today.toISOString()),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('restaurant_id', rid).in('status', ['pendente','pago','preparando','pronto']),
    supabase.from('orders').select('id, number, type, status, total, customer_name, created_at').eq('restaurant_id', rid).order('created_at', { ascending: false }).limit(8),
  ])

  const totalRevenue = (todayOrders || []).filter(o => o.status !== 'cancelado').reduce((a,o) => a + (o.total||0), 0)
  const cancelledToday = (todayOrders || []).filter(o => o.status === 'cancelado').length

  const cards = [
    { title: 'Faturamento Hoje', value: fmt(totalRevenue/100), icon: DollarSign, color: 'bg-emerald-500' },
    { title: 'Pedidos Hoje', value: String(todayOrders?.length||0), icon: Receipt, color: 'bg-blue-500' },
    { title: 'Em Andamento', value: String(activeOrders||0), icon: Clock, color: 'bg-orange-500' },
    { title: 'Cancelados', value: String(cancelledToday), icon: AlertTriangle, color: 'bg-red-500' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu restaurante hoje.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.title} className="bg-card border rounded-xl p-5 flex items-start gap-4">
            <div className={`${card.color} p-3 rounded-lg`}><card.icon className="w-5 h-5 text-white" /></div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pedidos Recentes</h2>
          <a href="/admin/pedidos" className="text-sm text-[#c8410a] hover:underline">Ver todos</a>
        </div>
        <div className="space-y-2">
          {!recentOrders || recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhum pedido ainda.</p>
          ) : recentOrders.map(order => (
            <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
              <div>
                <p className="font-medium text-sm">#{order.number || order.id.slice(0,6)} <span className="text-muted-foreground font-normal">{order.customer_name || 'Cliente'}</span></p>
                <p className="text-xs text-muted-foreground capitalize">{order.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{fmt(order.total/100)}</span>
                <Badge className={`text-xs shadow-none ${statusColor[order.status]||''}`}>{statusLabel[order.status]||order.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

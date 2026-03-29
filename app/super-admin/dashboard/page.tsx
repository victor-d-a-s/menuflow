export const runtime = 'edge'

import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Store, Users, Receipt, DollarSign, TrendingUp, AlertTriangle, Clock } from 'lucide-react'

export default async function SuperAdminDashboard() {
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { count: totalRestaurants },
    { count: activeRestaurants },
    { count: trialRestaurants },
    { count: suspendedRestaurants },
    { count: totalUsers },
    { count: totalOrders },
    { count: pendingOrders },
  ] = await Promise.all([
    supabase.from('restaurants').select('*', { count: 'exact', head: true }),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('plan_status', 'active'),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('plan_status', 'trial'),
    supabase.from('restaurants').select('*', { count: 'exact', head: true }).eq('plan_status', 'suspended'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pendente', 'pago', 'preparando', 'pronto']),
  ])

  const cards = [
    { title: 'Restaurantes', value: totalRestaurants || 0, icon: Store, color: 'bg-blue-500', sub: `${activeRestaurants || 0} ativos` },
    { title: 'Em Trial', value: trialRestaurants || 0, icon: Clock, color: 'bg-amber-500', sub: `${suspendedRestaurants || 0} suspensos` },
    { title: 'Usuários', value: totalUsers || 0, icon: Users, color: 'bg-purple-500', sub: 'na plataforma' },
    { title: 'Total de Pedidos', value: totalOrders || 0, icon: Receipt, color: 'bg-emerald-500', sub: `${pendingOrders || 0} em andamento` },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral da plataforma MenuFlow.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="bg-card border rounded-xl p-5 flex items-start gap-4">
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {(suspendedRestaurants || 0) > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{suspendedRestaurants} restaurante(s) suspenso(s) — verifique a seção Financeiro.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/super-admin/restaurantes" className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow group">
          <Store className="w-8 h-8 text-blue-500 mb-3" />
          <h3 className="font-semibold group-hover:text-blue-600">Gerenciar Restaurantes</h3>
          <p className="text-sm text-muted-foreground mt-1">Criar, editar e monitorar estabelecimentos.</p>
        </a>
        <a href="/super-admin/financeiro" className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow group">
          <DollarSign className="w-8 h-8 text-emerald-500 mb-3" />
          <h3 className="font-semibold group-hover:text-emerald-600">Visão Financeira</h3>
          <p className="text-sm text-muted-foreground mt-1">MRR, taxas e inadimplência.</p>
        </a>
        <a href="/super-admin/pedidos" className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow group">
          <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
          <h3 className="font-semibold group-hover:text-purple-600">Monitorar Pedidos</h3>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe todas as transações.</p>
        </a>
      </div>
    </div>
  )
}

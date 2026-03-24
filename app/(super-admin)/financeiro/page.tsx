export const dynamic = 'force-dynamic'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Activity, DollarSign, TrendingUp, CreditCard, AlertTriangle, Clock } from 'lucide-react'
import { FinancialFilters, ReactivateButton } from './components/client-components'

export const dynamic = 'force-dynamic'

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  let fromDate = new Date()
  let toDate = new Date()
  toDate.setHours(23, 59, 59, 999)

  const periodo = searchParams.periodo || 'este_mes'
  if (periodo === 'hoje') {
    fromDate.setHours(0, 0, 0, 0)
  } else if (periodo === '7d') {
    fromDate.setDate(now.getDate() - 7)
  } else if (periodo === '30d') {
    fromDate.setDate(now.getDate() - 30)
  } else if (periodo === 'este_mes') {
    fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (periodo === 'custom' && searchParams.de && searchParams.ate) {
    fromDate = new Date(`${searchParams.de}T00:00:00`)
    toDate = new Date(`${searchParams.ate}T23:59:59`)
  }

  const [
    { data: plans },
    { data: restaurants },
    { data: orders },
  ] = await Promise.all([
    supabaseAdmin.from('plans').select('slug, name, price_monthly'),
    // ✅ plan_status conforme schema
    supabaseAdmin.from('restaurants').select('id, name, plan, plan_status, trial_ends_at, stripe_customer_id, platform_fee_pct'),
    supabaseAdmin
      .from('orders')
      // ✅ total conforme schema
      .select('id, total, platform_fee, restaurant_id, status, created_at')
      .in('status', ['pago', 'entregue'])
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString()),
  ])

  const plansMap = new Map((plans || []).map(p => [p.slug, { ...p, price_monthly: p.price_monthly / 100 }]))

  let currentMRR = 0
  const planDistribution: Record<string, { count: number; value: number }> = {}
  const suspendedDelinquent: any[] = []
  const trialRestaurants: any[] = []
  const allSuspended: any[] = []

  restaurants?.forEach(rest => {
    const planDetails = plansMap.get(rest.plan || 'basico')
    const monthlyValue = planDetails?.price_monthly || 0

    // ✅ plan_status conforme schema
    if (rest.plan_status === 'suspended') {
      allSuspended.push(rest)
      if (rest.stripe_customer_id) {
        suspendedDelinquent.push({ ...rest, amountDue: monthlyValue })
      }
    }
    if (rest.plan_status === 'trial') trialRestaurants.push(rest)
    if (rest.plan_status === 'active') {
      currentMRR += monthlyValue
      if (!planDistribution[rest.plan]) planDistribution[rest.plan] = { count: 0, value: 0 }
      planDistribution[rest.plan].count += 1
      planDistribution[rest.plan].value += monthlyValue
    }
  })

  let totalVolume = 0
  let totalPlatformFees = 0
  const orderCount = orders?.length || 0
  const restStatsMap = new Map()

  orders?.forEach(order => {
    // ✅ total em centavos
    const amount = (order.total || 0) / 100
    totalVolume += amount

    const rest = restaurants?.find(r => r.id === order.restaurant_id)
    const restFeePct = rest?.platform_fee_pct || 0

    let fee = 0
    if (order.platform_fee !== null && order.platform_fee !== undefined) {
      fee = order.platform_fee / 100
    } else {
      fee = amount * (restFeePct / 100)
    }
    totalPlatformFees += fee

    if (!restStatsMap.has(order.restaurant_id)) {
      restStatsMap.set(order.restaurant_id, {
        name: rest?.name || 'Desconhecido',
        plan: rest?.plan || 'N/A',
        feePct: restFeePct,
        orderCount: 0,
        volume: 0,
        collectedFees: 0,
      })
    }
    const stats = restStatsMap.get(order.restaurant_id)
    stats.orderCount += 1
    stats.volume += amount
    stats.collectedFees += fee
  })

  const averageTicket = orderCount > 0 ? totalVolume / orderCount : 0
  const rankedRestaurants = Array.from(restStatsMap.values()).sort((a, b) => b.collectedFees - a.collectedFees)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visão Financeira</h1>
            <p className="text-muted-foreground">Métricas, faturamento e inadimplência da plataforma.</p>
          </div>
        </div>
        <FinancialFilters />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-50/30 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volume (GMV)</CardTitle>
            <Activity className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalVolume)}</div></CardContent>
        </Card>
        <Card className="bg-blue-50/30 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxas Arrecadadas</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-700">{formatCurrency(totalPlatformFees)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Pagos</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{orderCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(averageTicket)}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-zinc-900 text-zinc-50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-400 text-sm font-medium">MRR (Monthly Recurring Revenue)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black mb-6">{formatCurrency(currentMRR)}</div>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Distribuição Ativa</h4>
              {Object.entries(planDistribution).map(([planSlug, data]) => (
                <div key={planSlug} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-zinc-300 border-zinc-700 uppercase text-[10px]">{planSlug}</Badge>
                    <span className="text-zinc-400">{data.count} ass.</span>
                  </div>
                  <span className="font-medium">{formatCurrency(data.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Em Trial ({trialRestaurants.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2">
                {trialRestaurants.length === 0
                  ? <p className="text-sm text-muted-foreground">Nenhum restaurante em trial.</p>
                  : trialRestaurants.map(rest => (
                    <div key={rest.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                      <span className="font-medium truncate max-w-[150px]">{rest.name}</span>
                      <span className="text-xs text-muted-foreground">Expira: {rest.trial_ends_at ? new Date(rest.trial_ends_at).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" /> Suspensos ({allSuspended.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2">
                {allSuspended.length === 0
                  ? <p className="text-sm text-muted-foreground">Nenhum restaurante suspenso.</p>
                  : allSuspended.map(rest => (
                    <div key={rest.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                      <span className="font-medium truncate max-w-[150px]">{rest.name}</span>
                      <Badge variant="destructive" className="text-[10px]">INATIVO</Badge>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Inadimplência
          </h2>
          <p className="text-sm text-muted-foreground">Restaurantes suspensos com cadastro ativo em gateway de pagamento.</p>
        </div>
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurante</TableHead>
                <TableHead>Plano Bloqueado</TableHead>
                <TableHead>Valor em Atraso (Est.)</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suspendedDelinquent.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum registro de inadimplência no momento.</TableCell></TableRow>
              ) : (
                suspendedDelinquent.map(rest => (
                  <TableRow key={rest.id}>
                    <TableCell className="font-medium">
                      <Link href={`/super-admin/restaurantes/${rest.id}`} className="hover:underline">{rest.name}</Link>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="uppercase">{rest.plan}</Badge></TableCell>
                    <TableCell className="text-red-600 font-semibold">{formatCurrency(rest.amountDue)}</TableCell>
                    <TableCell className="text-right">
                      <ReactivateButton restaurantId={rest.id} restaurantName={rest.name} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t">
        <h2 className="text-xl font-semibold">Desempenho por Restaurante (Taxas)</h2>
        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Restaurante</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Volume (GMV)</TableHead>
                <TableHead className="text-right">Taxa (%)</TableHead>
                <TableHead className="text-right text-blue-600 font-bold">Taxas Geradas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedRestaurants.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma transação no período.</TableCell></TableRow>
              ) : (
                rankedRestaurants.map((rest, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{rest.name}</TableCell>
                    <TableCell><Badge variant="outline" className="uppercase">{rest.plan}</Badge></TableCell>
                    <TableCell className="text-right text-muted-foreground">{rest.orderCount}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(rest.volume)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{rest.feePct.toFixed(2)}%</TableCell>
                    <TableCell className="text-right font-bold text-blue-600 bg-blue-50/30">{formatCurrency(rest.collectedFees)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}

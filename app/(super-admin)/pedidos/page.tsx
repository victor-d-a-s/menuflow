export const runtime = "edge";
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Receipt, DollarSign, Ban, TrendingUp, Eye } from 'lucide-react'
import { OrderFilters } from './components/order-filters'

export const dynamic = 'force-dynamic'

export default async function PedidosGlobaisPage({
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

  const { data: restaurants } = await supabaseAdmin.from('restaurants').select('id, name').order('name')

  let query = supabaseAdmin
    .from('orders')
    .select('*, restaurants!inner(id, name, platform_fee_pct)', { count: 'exact' })

  if (searchParams.restaurante && searchParams.restaurante !== 'todos') query = query.eq('restaurant_id', searchParams.restaurante)
  if (searchParams.status && searchParams.status !== 'todos') query = query.eq('status', searchParams.status)
  if (searchParams.tipo && searchParams.tipo !== 'todos') query = query.eq('type', searchParams.tipo)
  if (searchParams.data_inicio) query = query.gte('created_at', `${searchParams.data_inicio}T00:00:00.000Z`)
  if (searchParams.data_fim) query = query.lte('created_at', `${searchParams.data_fim}T23:59:59.999Z`)

  const limit = 30
  const page = parseInt(searchParams.pagina || '1')
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data: paginatedOrders, count, error } = await query
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) console.error('Erro ao buscar pedidos:', error)

  const totalPages = Math.ceil((count || 0) / limit)

  // ✅ Calcular totais usando campo `total` (centavos) conforme schema
  let totalVolume = 0
  let totalPlatformFee = 0
  let cancelledCount = 0

  paginatedOrders?.forEach((order: any) => {
    if (order.status === 'cancelado') { cancelledCount++; return }
    // ✅ total em centavos
    const amount = (order.total || 0) / 100
    totalVolume += amount
    const fee = order.platform_fee !== null && order.platform_fee !== undefined
      ? order.platform_fee / 100
      : amount * ((order.restaurants?.platform_fee_pct || 0) / 100)
    totalPlatformFee += fee
  })

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pendente: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
      pago: 'bg-blue-500/10 text-blue-600 border-blue-200',
      preparando: 'bg-orange-500/10 text-orange-600 border-orange-200',
      pronto: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
      entregue: 'bg-zinc-500/10 text-zinc-600 border-zinc-200',
      cancelado: 'bg-red-500/10 text-red-600 border-red-200',
    }
    return <Badge variant="outline" className={`shadow-none ${styles[status] || ''}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      delivery: 'bg-purple-100 text-purple-700',
      mesa: 'bg-indigo-100 text-indigo-700',
      retirada: 'bg-teal-100 text-teal-700',
    }
    return <Badge className={`shadow-none ${styles[type] || ''}`}>{type.toUpperCase()}</Badge>
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg"><Receipt className="w-6 h-6 text-primary" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todos os Pedidos</h1>
          <p className="text-muted-foreground">Monitoramento global de transações da plataforma.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pedidos</CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{count || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volume Transacionado</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(totalVolume)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa Arrecadada</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPlatformFee)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos Cancelados</CardTitle>
            <Ban className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{cancelledCount}</div></CardContent>
        </Card>
      </div>

      <OrderFilters restaurants={restaurants || []} />

      <div className="border rounded-md bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Pedido #</TableHead>
              <TableHead>Restaurante</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Taxa</TableHead>
              <TableHead>Data / Hora</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!paginatedOrders || paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                  Nenhum pedido encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order: any) => {
                // ✅ total em centavos
                const amountInReais = (order.total || 0) / 100
                const feeInReais = order.platform_fee !== null && order.platform_fee !== undefined
                  ? order.platform_fee / 100
                  : amountInReais * ((order.restaurants?.platform_fee_pct || 0) / 100)

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium font-mono">{order.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <Link href={`/super-admin/restaurantes/${order.restaurant_id}`} className="hover:underline text-blue-600 font-medium">
                        {order.restaurants?.name || 'Desconhecido'}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">{order.customer_name || '—'}</TableCell>
                    <TableCell>{getTypeBadge(order.type)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(amountInReais)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium text-sm">{formatCurrency(feeInReais)}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/super-admin/pedidos/${order.id}`}><Eye className="w-4 h-4 mr-2" />Detalhes</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span> ({count} pedidos)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild>
              <Link href={`?${new URLSearchParams({ ...searchParams, pagina: (page - 1).toString() })}`}>Anterior</Link>
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
              <Link href={`?${new URLSearchParams({ ...searchParams, pagina: (page + 1).toString() })}`}>Próxima</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

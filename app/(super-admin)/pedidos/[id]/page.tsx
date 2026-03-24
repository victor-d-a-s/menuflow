export const runtime = "edge";
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MapPin, Phone, User as UserIcon, CreditCard, Receipt } from 'lucide-react'
import { OrderSupportActions } from './components/order-actions'

export const dynamic = 'force-dynamic'

export default async function DetalhePedidoPage({ params }: { params: { id: string } }) {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  // ✅ supabaseAdmin para ignorar RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ✅ Sem join com products — usando snapshot product_name em order_items
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      *,
      restaurants(id, name, platform_fee_pct),
      tables(name_or_number),
      order_items(id, quantity, unit_price, notes, product_name)
    `)
    .eq('id', params.id)
    .single()

  if (error || !order) notFound()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  // ✅ total em centavos conforme schema
  const totalInReais = (order.total || 0) / 100
  const subtotalInReais = order.order_items?.reduce(
    (acc: number, item: any) => acc + ((item.unit_price * item.quantity) / 100), 0
  ) || totalInReais

  const feeInReais = order.platform_fee !== null && order.platform_fee !== undefined
    ? order.platform_fee / 100
    : totalInReais * ((order.restaurants?.platform_fee_pct || 0) / 100)

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pendente: 'bg-yellow-500 text-white', pago: 'bg-blue-500 text-white',
      preparando: 'bg-orange-500 text-white', pronto: 'bg-emerald-400 text-white',
      entregue: 'bg-zinc-600 text-white', cancelado: 'bg-red-500 text-white',
    }
    return <Badge className={`text-sm ${styles[status] || ''}`}>{status.toUpperCase()}</Badge>
  }

  const timelineSteps = ['pendente', 'pago', 'preparando', 'pronto', 'entregue']
  const currentStepIndex = timelineSteps.indexOf(order.status)
  const isCancelled = order.status === 'cancelado'

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" asChild className="mt-1">
            <Link href="/super-admin/pedidos"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">Pedido #{order.id.slice(0, 8)}</h1>
              {getStatusBadge(order.status)}
              <Badge variant="outline" className="uppercase bg-background">{order.type}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Criado em {new Date(order.created_at).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      </div>

      <OrderSupportActions orderId={order.id} currentStatus={order.status} />

      {/* Timeline */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {isCancelled ? (
            <div className="flex flex-col items-center justify-center text-red-500 py-4">
              <Badge variant="destructive" className="mb-2 text-base px-4 py-1">PEDIDO CANCELADO</Badge>
              <p className="text-sm text-muted-foreground">O fluxo deste pedido foi interrompido.</p>
            </div>
          ) : (
            <div className="relative flex justify-between items-center">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${(Math.max(0, currentStepIndex) / (timelineSteps.length - 1)) * 100}%` }}
                />
              </div>
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isActive = index === currentStepIndex
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-2 bg-card px-2">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                      ${isActive ? 'border-primary bg-primary ring-4 ring-primary/20' :
                        isCompleted ? 'border-primary bg-primary' : 'border-muted-foreground/30 bg-card'}`}>
                      {isCompleted && !isActive && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                    </div>
                    <span className={`text-xs font-medium uppercase ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Detalhes do Pedido</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-md"><MapPin className="w-4 h-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Restaurante</p>
                <Link href={`/super-admin/restaurantes/${order.restaurant_id}`} className="text-sm font-semibold text-blue-600 hover:underline">
                  {order.restaurants?.name || 'Desconhecido'}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-600 rounded-md"><Receipt className="w-4 h-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Consumo</p>
                <p className="text-sm font-semibold uppercase">{order.type}{order.tables && ` - Mesa ${order.tables.name_or_number}`}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md"><UserIcon className="w-4 h-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="text-sm font-semibold">{order.customer_name || 'Não informado'}</p>
              </div>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md"><Phone className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-semibold">{order.customer_phone}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Gateway Provider</span>
              <span className="text-sm font-medium capitalize">{order.payment_provider || 'Não registrado'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">ID da Transação</span>
              <span className="text-sm font-mono text-muted-foreground truncate max-w-[200px]">{order.payment_id || '—'}</span>
            </div>
            <div className="flex items-center gap-3 mt-4 pt-2">
              <div className="p-2 bg-zinc-100 text-zinc-600 rounded-md"><CreditCard className="w-4 h-4" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa da Plataforma</p>
                <p className="text-sm font-semibold text-blue-600">{formatCurrency(feeInReais)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Itens */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Itens do Pedido</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Preço Unitário</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!order.order_items || order.order_items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">Nenhum item registrado.</TableCell></TableRow>
                ) : (
                  order.order_items.map((item: any) => (
                    <TableRow key={item.id}>
                      {/* ✅ product_name snapshot — não depende de join com products */}
                      <TableCell className="font-medium">
                        {item.product_name}
                        {item.notes && <div className="text-xs text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded mt-1">Obs: {item.notes}</div>}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}x</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(item.unit_price / 100)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency((item.unit_price * item.quantity) / 100)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-end gap-2 mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between w-full max-w-xs text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotalInReais)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs text-lg font-bold pt-2 border-t mt-2">
              <span>Total Pago:</span>
              <span className="text-emerald-600">{formatCurrency(totalInReais)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

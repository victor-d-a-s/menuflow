'use client'
export const runtime = 'edge'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { updateOrderStatus } from './actions'

type OrderItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  notes?: string
}

type Order = {
  id: string
  number?: number
  type: string
  status: string
  total: number
  customer_name?: string
  customer_phone?: string
  notes?: string
  created_at: string
  order_items?: OrderItem[]
}

const statusLabel: Record<string, string> = {
  pendente: 'Pendente', pago: 'Pago', preparando: 'Preparando',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
}

const statusColor: Record<string, string> = {
  pendente: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  pago: 'bg-blue-500/10 text-blue-700 border-blue-200',
  preparando: 'bg-orange-500/10 text-orange-700 border-orange-200',
  pronto: 'bg-green-500/10 text-green-700 border-green-200',
  entregue: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  cancelado: 'bg-red-500/10 text-red-700 border-red-200',
}

const nextStatus: Record<string, string> = {
  pendente: 'pago',
  pago: 'preparando',
  preparando: 'pronto',
  pronto: 'entregue',
}

const nextStatusLabel: Record<string, string> = {
  pendente: '→ Marcar Pago',
  pago: '→ Preparando',
  preparando: '→ Pronto',
  pronto: '→ Entregue',
}

const fmt = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export function PedidosClient({ initialOrders, restaurantId }: { initialOrders: Order[], restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `restaurant_id=eq.${restaurantId}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new as Order, ...prev])
          toast.info('Novo pedido recebido!')
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
        } else if (payload.eventType === 'DELETE') {
          setOrders(prev => prev.filter(o => o.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  const handleAdvanceStatus = (order: Order) => {
    const next = nextStatus[order.status]
    if (!next) return
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, next, restaurantId)
      if (res.error) toast.error(res.error)
      else toast.success(`Pedido #${order.number || order.id.slice(0, 6)} → ${statusLabel[next]}`)
    })
  }

  const handleCancel = (order: Order) => {
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, 'cancelado', restaurantId)
      if (res.error) toast.error(res.error)
      else toast.success('Pedido cancelado.')
    })
  }

  const filtered = filterStatus === 'todos'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  const activeCount = orders.filter(o => ['pendente', 'pago', 'preparando', 'pronto'].includes(o.status)).length

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="todos">Todos</SelectItem>
            {Object.entries(statusLabel).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            {activeCount} pedido(s) em andamento
          </div>
        )}
        {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Lista de pedidos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum pedido encontrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className={`bg-card border rounded-xl overflow-hidden transition-all ${order.status === 'cancelado' ? 'opacity-60' : ''}`}>
              {/* Header do pedido */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="flex items-center gap-2 hover:text-[#c8410a] transition-colors"
                  >
                    {expandedId === order.id
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                    <span className="font-bold">#{order.number || order.id.slice(0, 6)}</span>
                  </button>
                  <Badge className={`text-xs shadow-none border ${statusColor[order.status]}`}>
                    {statusLabel[order.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground capitalize hidden sm:inline">{order.type}</span>
                  {order.customer_name && (
                    <span className="text-sm text-muted-foreground hidden sm:inline">— {order.customer_name}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{fmt(order.total / 100)}</span>
                  {nextStatus[order.status] && (
                    <Button size="sm" onClick={() => handleAdvanceStatus(order)} disabled={isPending}
                      className="bg-[#c8410a] hover:bg-[#a63508] text-white text-xs h-8">
                      {nextStatusLabel[order.status]}
                    </Button>
                  )}
                  {!['entregue', 'cancelado'].includes(order.status) && (
                    <Button size="sm" variant="ghost" onClick={() => handleCancel(order)}
                      disabled={isPending} className="text-red-500 hover:text-red-600 text-xs h-8">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>

              {/* Detalhes expandidos */}
              {expandedId === order.id && (
                <div className="border-t px-4 py-3 bg-muted/30 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <p className="font-medium capitalize">{order.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="font-medium">{order.customer_name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{order.customer_phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horário</p>
                      <p className="font-medium">
                        {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      <span className="font-medium">Obs: </span>{order.notes}
                    </div>
                  )}

                  {order.order_items && order.order_items.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Itens</p>
                      <div className="space-y-1">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product_name}
                              {item.notes && <span className="text-muted-foreground"> ({item.notes})</span>}
                            </span>
                            <span className="font-medium">{fmt((item.quantity * item.unit_price) / 100)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Necessário para o ícone no empty state
import { Receipt } from 'lucide-react'

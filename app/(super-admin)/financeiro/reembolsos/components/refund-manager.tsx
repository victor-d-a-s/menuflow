'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Search, Undo2, AlertCircle, Loader2, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

import { findOrderForRefund, processRefund } from '../actions'

export function RefundManager() {
  const [isSearching, startSearch] = useTransition()
  const [isProcessing, startProcessing] = useTransition()

  const [query, setQuery] = useState('')
  const [order, setOrder] = useState<any>(null)

  const [refundType, setRefundType] = useState<'total' | 'parcial'>('total')
  const [partialAmount, setPartialAmount] = useState<string>('')
  const [reason, setReason] = useState('solicitacao_cliente')
  const [notes, setNotes] = useState('')

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    startSearch(async () => {
      const res = await findOrderForRefund(query)
      if (res.error) {
        toast.error(res.error)
        setOrder(null)
      } else {
        setOrder(res.order)
        setRefundType('total')
        setPartialAmount('')
      }
    })
  }

  const handleProcessRefund = () => {
    if (!order) return

    // ✅ total em centavos conforme schema
    let amountCents = order.total
    if (refundType === 'parcial') {
      const parsedAmount = parseFloat(partialAmount.replace(',', '.'))
      if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.error('Valor parcial inválido.')
      amountCents = Math.round(parsedAmount * 100)
      if (amountCents > order.total) return toast.error('O reembolso parcial não pode ser maior que o total do pedido.')
    }

    startProcessing(async () => {
      const res = await processRefund({
        orderId: order.id,
        paymentId: order.payment_id,
        paymentProvider: order.payment_provider,
        amountCents,
        reason: reason as any,
        notes,
      })

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Reembolso processado com sucesso!')
        setOrder({ ...order, status: 'cancelado' })
        setQuery('')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* BARRA DE BUSCA */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Buscar Pedido</CardTitle>
          <CardDescription>Localize a transação pelo ID do Pedido ou Payment ID (Gateway).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ex: ord_123456 ou payment_id..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={isSearching || !query.trim()}>
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* RESULTADO E FORMULÁRIO */}
      {order && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* DETALHES DO PEDIDO */}
          <Card className="bg-muted/30">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Detalhes da Transação</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 font-mono">#{order.id.slice(0, 8)}</p>
                </div>
                {order.status === 'cancelado'
                  ? <Badge variant="destructive">Estornado / Cancelado</Badge>
                  : <Badge className="bg-emerald-500">Apto para Reembolso</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-y-2 border-b pb-4">
                <span className="text-muted-foreground">Restaurante:</span>
                <span className="font-medium text-right">{order.restaurants?.name}</span>
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium text-right">{order.customer_name || 'N/A'}</span>
                <span className="text-muted-foreground">Data/Hora:</span>
                <span className="text-right">{new Date(order.created_at).toLocaleString('pt-BR')}</span>
                <span className="text-muted-foreground">Gateway:</span>
                <span className="font-medium text-right capitalize">{order.payment_provider || 'Não registrado'}</span>
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="text-right font-mono truncate" title={order.payment_id}>{order.payment_id || '—'}</span>
              </div>

              <div>
                <span className="text-muted-foreground font-medium mb-2 block">Itens do Pedido:</span>
                <ul className="space-y-1">
                  {order.order_items?.map((item: any) => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>{formatCurrency((item.quantity * item.unit_price) / 100)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center pt-4 border-t text-base font-bold">
                <span>Total Pago:</span>
                {/* ✅ total em centavos */}
                <span className="text-emerald-600">{formatCurrency(order.total / 100)}</span>
              </div>
            </CardContent>
          </Card>

          {/* AÇÃO DE REEMBOLSO */}
          <Card className={order.status === 'cancelado' ? 'opacity-50 pointer-events-none grayscale' : 'border-red-200 shadow-sm'}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                <Undo2 className="w-5 h-5" /> Configurar Reembolso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              <div className="space-y-3">
                <Label>Tipo de Estorno</Label>
                <RadioGroup value={refundType} onValueChange={(v: 'total' | 'parcial') => setRefundType(v)} className="flex gap-4">
                  <div className="flex items-center space-x-2 border p-3 rounded-md flex-1 cursor-pointer hover:bg-muted/50" onClick={() => setRefundType('total')}>
                    <RadioGroupItem value="total" id="r1" />
                    {/* ✅ total em centavos */}
                    <Label htmlFor="r1" className="cursor-pointer">Total ({formatCurrency(order.total / 100)})</Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-md flex-1 cursor-pointer hover:bg-muted/50" onClick={() => setRefundType('parcial')}>
                    <RadioGroupItem value="parcial" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer">Parcial</Label>
                  </div>
                </RadioGroup>
              </div>

              {refundType === 'parcial' && (
                <div className="space-y-2">
                  <Label>Valor a ser reembolsado (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 15.50"
                    value={partialAmount}
                    onChange={e => setPartialAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Máximo: {formatCurrency(order.total / 100)}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solicitacao_cliente">Solicitação do Cliente</SelectItem>
                    <SelectItem value="produto_indisponivel">Produto Indisponível</SelectItem>
                    <SelectItem value="erro_sistema">Erro Sistêmico</SelectItem>
                    <SelectItem value="outro">Outro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações Internas (Opcional)</Label>
                <Textarea
                  placeholder="Detalhes adicionais sobre este reembolso..."
                  className="resize-none"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Revisar e Emitir Reembolso <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertCircle className="text-red-600 w-5 h-5" /> Confirmar Reembolso
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2 pt-2">
                      <p>Você está prestes a emitir uma ordem real de estorno no gateway <b>({order.payment_provider})</b>.</p>
                      <div className="bg-muted p-3 rounded-md text-foreground text-sm space-y-1">
                        <div className="flex justify-between"><span>Pedido:</span> <strong>#{order.id.slice(0, 8)}</strong></div>
                        <div className="flex justify-between">
                          <span>Valor do Estorno:</span>
                          <strong className="text-red-600">
                            {refundType === 'total'
                              ? formatCurrency(order.total / 100)
                              : formatCurrency(parseFloat(partialAmount || '0'))}
                          </strong>
                        </div>
                        <div className="flex justify-between"><span>Tipo:</span> <strong>{refundType === 'total' ? 'Integral' : 'Parcial'}</strong></div>
                      </div>
                      <p className="text-red-600 font-medium">Esta ação não pode ser desfeita.</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleProcessRefund} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
                      {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirmar Estorno Irreversível'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

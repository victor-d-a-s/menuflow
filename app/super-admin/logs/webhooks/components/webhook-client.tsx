'use client'
export const runtime = 'edge'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react'

interface WebhookLog {
  id: string
  provider: string
  event_type?: string
  payload?: any
  signature_valid: boolean
  status: string
  error_message?: string
  order_id?: string
  created_at: string
}

export function WebhookLogsClient({ logs }: { logs: WebhookLog[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [provider, setProvider] = useState(searchParams.get('provider') || 'todos')
  const [status, setStatus] = useState(searchParams.get('status') || 'todos')
  const [periodo, setPeriodo] = useState(searchParams.get('periodo') || 'hoje')
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null)

  // ✅ Função direta em vez de useEffect — evita loop infinito
  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'todos') params.set(key, value)
    else params.delete(key)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  const handleProviderChange = (val: string) => { setProvider(val); applyFilter('provider', val) }
  const handleStatusChange = (val: string) => { setStatus(val); applyFilter('status', val) }
  const handlePeriodoChange = (val: string) => { setPeriodo(val); applyFilter('periodo', val) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border">
        <Select value={provider} onValueChange={handleProviderChange}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Providers</SelectItem>
            <SelectItem value="pagarme">Pagar.me</SelectItem>
            <SelectItem value="mercadopago">Mercado Pago</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="processed">Processados (OK)</SelectItem>
            <SelectItem value="failed">Falhas (Erro)</SelectItem>
            <SelectItem value="received">Apenas Recebidos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={periodo} onValueChange={handlePeriodoChange}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>

        {isPending && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground ml-auto self-center" />}
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Data / Hora</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead className="text-center">Assinatura</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum log encontrado para estes filtros.</TableCell></TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedLog(log)}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </TableCell>
                  <TableCell><Badge variant="outline" className="uppercase shadow-none">{log.provider}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{log.event_type || 'desconhecido'}</TableCell>
                  <TableCell>
                    {log.order_id ? (
                      <Button variant="link" className="h-auto p-0 font-mono text-xs text-blue-600" onClick={(e) => e.stopPropagation()} asChild>
                        <Link href={`/super-admin/pedidos/${log.order_id}`}>{log.order_id.slice(0, 8)}...</Link>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.signature_valid
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                      : <XCircle className="w-4 h-4 text-red-500 mx-auto" />}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.status === 'processed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                      className={log.status === 'processed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                    >
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              Detalhes do Webhook
              <Badge variant="outline" className="uppercase">{selectedLog?.provider}</Badge>
            </SheetTitle>
            <SheetDescription>
              Recebido em {selectedLog ? new Date(selectedLog.created_at).toLocaleString('pt-BR') : ''}
            </SheetDescription>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-6">
              {selectedLog.status === 'failed' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold text-red-600 text-sm mb-1 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Motivo da Falha
                  </h4>
                  <p className="text-sm text-red-700 font-mono break-words">{selectedLog.error_message}</p>
                </div>
              )}

              {selectedLog.order_id && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                  <span className="text-muted-foreground font-medium">Pedido Vinculado:</span>
                  <Link href={`/super-admin/pedidos/${selectedLog.order_id}`} className="font-mono text-blue-600 hover:underline flex items-center gap-1">
                    {selectedLog.order_id} <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Payload (JSON)</h4>
                <div className="bg-zinc-950 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-zinc-300 font-mono leading-relaxed">
                    <code>{JSON.stringify(selectedLog.payload, null, 2)}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

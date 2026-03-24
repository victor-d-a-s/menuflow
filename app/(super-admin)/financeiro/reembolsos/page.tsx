import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Undo2, History } from 'lucide-react'
import { RefundManager } from './components/refund-manager'

export const dynamic = 'force-dynamic'

export default async function ReembolsosPage() {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: recentRefunds } = await supabaseAdmin
    .from('refunds')
    .select(`
      id, amount, reason, created_at,
      orders(id),
      profiles!created_by(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  const formatReason = (reason: string) => {
    const reasons: Record<string, string> = {
      erro_sistema: 'Erro Sistêmico',
      solicitacao_cliente: 'Solicitação do Cliente',
      produto_indisponivel: 'Falta de Estoque',
      outro: 'Outro',
    }
    return reasons[reason] || reason
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">

      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-red-100 text-red-700 rounded-lg"><Undo2 className="w-6 h-6" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Reembolsos</h1>
          <p className="text-muted-foreground">Emissão de estornos manuais e histórico de devoluções.</p>
        </div>
      </div>

      <RefundManager />

      <section className="space-y-4 pt-8">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Últimos Reembolsos</h2>
        </div>

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Valor Devolvido</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Executado por</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!recentRefunds || recentRefunds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum reembolso processado recentemente.
                  </TableCell>
                </TableRow>
              ) : (
                recentRefunds.map((refund: any) => (
                  <TableRow key={refund.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(refund.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      #{refund.orders?.id?.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-bold text-red-600">
                      {formatCurrency(refund.amount / 100)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-background shadow-none font-normal text-muted-foreground">
                        {formatReason(refund.reason)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {refund.profiles?.full_name || 'Sistema'}
                    </TableCell>
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

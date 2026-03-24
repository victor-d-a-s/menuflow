'use client';
'use client';
export const runtime = 'edge';
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Webhook, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { WebhookLogsClient } from './components/webhook-client'

export const dynamic = 'force-dynamic'

export default async function WebhooksLogsPage({
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
  let queryFromDate = new Date()
  const periodo = searchParams.periodo || 'hoje'
  if (periodo === 'hoje') queryFromDate.setHours(0, 0, 0, 0)
  else if (periodo === '7d') queryFromDate.setDate(now.getDate() - 7)
  else if (periodo === '30d') queryFromDate.setDate(now.getDate() - 30)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  let query = supabaseAdmin
    .from('webhook_logs')
    .select('*')
    .gte('created_at', queryFromDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.provider && searchParams.provider !== 'todos') query = query.eq('provider', searchParams.provider)
  if (searchParams.status && searchParams.status !== 'todos') query = query.eq('status', searchParams.status)

  const [
    { data: logs },
    { count: countToday },
    { count: countProcessedToday },
    { count: countFailed24h },
  ] = await Promise.all([
    query,
    supabaseAdmin.from('webhook_logs').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()),
    supabaseAdmin.from('webhook_logs').select('*', { count: 'exact', head: true }).gte('created_at', startOfToday.toISOString()).eq('status', 'processed'),
    supabaseAdmin.from('webhook_logs').select('*', { count: 'exact', head: true }).gte('created_at', last24h.toISOString()).eq('status', 'failed'),
  ])

  const totalToday = countToday || 0
  const processedToday = countProcessedToday || 0
  const successRate = totalToday > 0 ? Math.round((processedToday / totalToday) * 100) : 100

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><Webhook className="w-6 h-6" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Webhooks</h1>
          <p className="text-muted-foreground">Monitoramento de eventos recebidos dos gateways de pagamento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recebidos Hoje</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalToday}</div></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Sucesso (Hoje)</CardTitle>
            <CheckCircle2 className={`w-4 h-4 ${successRate >= 95 ? 'text-emerald-500' : 'text-amber-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${successRate >= 95 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {successRate}%
            </div>
          </CardContent>
        </Card>

        <Card className={countFailed24h && countFailed24h > 0 ? 'border-red-200 bg-red-50/30' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Falhas (Últimas 24h)</CardTitle>
            <AlertTriangle className={`w-4 h-4 ${countFailed24h && countFailed24h > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${countFailed24h && countFailed24h > 0 ? 'text-red-600' : ''}`}>
              {countFailed24h || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <WebhookLogsClient logs={logs || []} />
    </div>
  )
}

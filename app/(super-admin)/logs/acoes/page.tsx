'use client';
'use client';
export const runtime = 'edge';
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { ShieldCheck } from 'lucide-react'
import { AuditLogsClient } from './components/audit-client'

export const dynamic = 'force-dynamic'

export default async function AuditoriaAcoesPage({
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

  let query = supabaseAdmin
    .from('audit_logs')
    .select('*, profiles(full_name)')
    .gte('created_at', queryFromDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(100)

  if (searchParams.admin && searchParams.admin !== 'todos') query = query.eq('admin_id', searchParams.admin)
  if (searchParams.acao && searchParams.acao !== 'todos') query = query.eq('action', searchParams.acao)
  if (searchParams.entidade && searchParams.entidade !== 'todos') query = query.eq('entity_type', searchParams.entidade)

  const [
    { data: logs },
    { data: admins },
    { data: actionsData },
  ] = await Promise.all([
    query,
    supabaseAdmin.from('profiles').select('id, full_name').eq('role', 'super_admin'),
    supabaseAdmin.from('audit_logs').select('action').limit(1000),
  ])

  const distinctActions = Array.from(new Set((actionsData || []).map(a => a.action))).sort()

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-slate-100 text-slate-700 rounded-lg dark:bg-slate-800 dark:text-slate-300">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria de Sistema</h1>
          <p className="text-muted-foreground">Registro de todas as ações administrativas realizadas no painel Super Admin.</p>
        </div>
      </div>

      <AuditLogsClient
        logs={logs || []}
        admins={admins || []}
        distinctActions={distinctActions}
      />
    </div>
  )
}

export const dynamic = 'force-dynamic'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Settings as SettingsIcon } from 'lucide-react'
import { SettingsTabs } from './components/settings-tabs'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: settingsData },
    { data: plans },
    { data: restaurants },
  ] = await Promise.all([
    supabaseAdmin.from('platform_settings').select('key, value'),
    supabaseAdmin.from('plans').select('id, name, default_fee_pct'),
    // ✅ payment_provider conforme schema
    supabaseAdmin.from('restaurants').select('payment_provider'),
  ])

  const settingsObj: Record<string, string> = {}
  settingsData?.forEach(item => { settingsObj[item.key] = item.value })

  // ✅ payment_provider conforme schema
  const gatewayUsage: Record<string, number> = { pagarme: 0, mercadopago: 0, stripe: 0 }
  restaurants?.forEach(r => {
    if (r.payment_provider && gatewayUsage[r.payment_provider] !== undefined) {
      gatewayUsage[r.payment_provider]++
    }
  })

  const envStatus = {
    pagarme: !!process.env.PAGARME_API_KEY,
    mercadopago: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
    stripe: !!process.env.STRIPE_SECRET_KEY,
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://menuflow.com.br'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-zinc-100 text-zinc-700 rounded-lg dark:bg-zinc-800 dark:text-zinc-300">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Plataforma</h1>
          <p className="text-muted-foreground">Variáveis globais, integração de pagamentos e comunicação.</p>
        </div>
      </div>

      <SettingsTabs
        settings={settingsObj}
        gatewayUsage={gatewayUsage}
        envStatus={envStatus}
        plans={plans || []}
        baseUrl={baseUrl}
      />
    </div>
  )
}

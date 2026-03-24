import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Landmark, AlertCircle } from 'lucide-react'
import { PlanCard, OverrideForm } from './components/plan-components'

export const dynamic = 'force-dynamic'

export default async function PlanosPage() {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: plans },
    { data: restaurants },
  ] = await Promise.all([
    supabaseAdmin.from('plans').select('*').order('price_monthly', { ascending: true }),
    // ✅ platform_fee_pct conforme schema
    supabaseAdmin.from('restaurants').select('id, name, plan, platform_fee_pct').order('name', { ascending: true }),
  ])

  const plansMap = new Map((plans || []).map(p => [p.slug, p]))

  const overriddenRestaurants = (restaurants || []).filter(rest => {
    const defaultPlanData = plansMap.get(rest.plan || 'basico')
    if (!defaultPlanData) return false
    return Math.abs(rest.platform_fee_pct - defaultPlanData.default_fee_pct) > 0.01
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10">

      <div className="flex items-center gap-3 border-b pb-6">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Landmark className="w-6 h-6" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos e Faturamento</h1>
          <p className="text-muted-foreground">Gerencie as assinaturas globais e exceções comerciais.</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Configuração Global (Padrão)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map(plan => <PlanCard key={plan.id} plan={plan} />)}
        </div>
      </section>

      <section className="space-y-4">
        <OverrideForm restaurants={restaurants || []} plans={plans || []} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Exceções Ativas</h2>
          <Badge variant="secondary" className="ml-2 bg-muted text-muted-foreground">
            {overriddenRestaurants.length} contratos
          </Badge>
        </div>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurante</TableHead>
                <TableHead>Plano Atual</TableHead>
                <TableHead className="text-right">Taxa Padrão</TableHead>
                <TableHead className="text-right text-primary font-bold">Taxa Aplicada</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overriddenRestaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    Todos os restaurantes estão seguindo as taxas padrões dos seus planos.
                  </TableCell>
                </TableRow>
              ) : (
                overriddenRestaurants.map(rest => {
                  const defaultPlan = plansMap.get(rest.plan || 'basico')
                  const defaultFee = defaultPlan?.default_fee_pct || 0
                  const diff = rest.platform_fee_pct - defaultFee
                  return (
                    <TableRow key={rest.id}>
                      <TableCell className="font-medium">
                        <Link href={`/super-admin/restaurantes/${rest.id}`} className="hover:underline text-blue-600">{rest.name}</Link>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="uppercase">{rest.plan}</Badge></TableCell>
                      <TableCell className="text-right text-muted-foreground">{defaultFee.toFixed(2)}%</TableCell>
                      <TableCell className="text-right font-bold text-primary">{rest.platform_fee_pct.toFixed(2)}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={diff < 0 ? 'secondary' : 'destructive'} className={`shadow-none ${diff < 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
          <AlertCircle className="w-3 h-3" />
          Taxas positivas indicam acréscimo comercial; taxas negativas (verde) indicam desconto concedido ao lojista.
        </p>
      </section>
    </div>
  )
}

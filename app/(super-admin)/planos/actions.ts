'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const planSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  price_monthly: z.coerce.number().min(0),
  price_annual: z.coerce.number().min(0),
  default_fee_pct: z.coerce.number().min(0).max(100),
  features: z.string(),
  active: z.boolean(),
})

export async function updatePlan(slug: string, data: z.infer<typeof planSchema>) {
  const parsed = planSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const values = parsed.data
  const featuresArray = values.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)

  const { error } = await supabaseAdmin
    .from('plans')
    .update({
      name: values.name,
      price_monthly: Math.round(values.price_monthly * 100),
      price_annual: Math.round(values.price_annual * 100),
      default_fee_pct: values.default_fee_pct,
      features: featuresArray,
      active: values.active,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)

  if (error) return { error: error.message }

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: 'update_plan', entityType: 'plan', entityId: slug })

  revalidatePath('/super-admin/planos')
  return { success: true }
}

export const overrideSchema = z.object({
  restaurantId: z.string().uuid('Selecione um restaurante'),
  plan: z.string().min(1),
  customFee: z.coerce.number().min(0).max(100),
  addTrialDays: z.coerce.number().min(0).default(0),
})

export async function applyOverride(data: z.infer<typeof overrideSchema>) {
  const parsed = overrideSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { restaurantId, plan, customFee, addTrialDays } = parsed.data

  const { data: rest, error: fetchError } = await supabaseAdmin
    .from('restaurants')
    .select('trial_ends_at, plan_status')
    .eq('id', restaurantId)
    .single()

  if (fetchError || !rest) return { error: 'Restaurante não encontrado.' }

  const updates: Record<string, any> = {
    plan,
    // ✅ platform_fee_pct conforme schema
    platform_fee_pct: customFee,
  }

  if (addTrialDays > 0) {
    const baseDate = rest.trial_ends_at && new Date(rest.trial_ends_at) > new Date()
      ? new Date(rest.trial_ends_at)
      : new Date()
    updates.trial_ends_at = new Date(baseDate.getTime() + addTrialDays * 24 * 60 * 60 * 1000).toISOString()
    // ✅ plan_status conforme schema
    updates.plan_status = 'trial'
  }

  const { error } = await supabaseAdmin.from('restaurants').update(updates).eq('id', restaurantId)
  if (error) return { error: error.message }

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: 'apply_plan_override', entityType: 'plan', entityId: restaurantId, details: { plan, customFee, addTrialDays } })

  revalidatePath('/super-admin/planos')
  return { success: true }
}

'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAction } from '@/lib/audit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const updateRestaurantSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
  // ✅ color_primary conforme schema
  color_primary: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Hex inválido'),
  delivery_enabled: z.boolean(),
  // ✅ table_enabled conforme schema
  table_enabled: z.boolean(),
  // ✅ payment_provider conforme schema
  payment_provider: z.enum(['pagarme', 'mercadopago', 'stripe']),
  plan: z.enum(['basico', 'pro', 'ultra']),
  // ✅ plan_status conforme schema
  plan_status: z.enum(['trial', 'active', 'suspended']),
  // ✅ platform_fee_pct conforme schema
  platform_fee_pct: z.coerce.number().min(0),
  pagarme_recipient_id: z.string().optional().nullable(),
  stripe_customer_id: z.string().optional().nullable(),
})

export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>

export async function updateRestaurant(id: string, data: UpdateRestaurantInput) {
  const parsed = updateRestaurantSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { error } = await supabaseAdmin
    .from('restaurants')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { error: error.message }

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: 'update_restaurant', entityType: 'restaurant', entityId: id, details: parsed.data })

  revalidatePath(`/super-admin/restaurantes/${id}`)
  return { success: true }
}

export async function deleteRestaurant(id: string) {
  // ✅ Status em português conforme enum order_status do schema
  const { count, error: countError } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('restaurant_id', id)
    .in('status', ['pendente', 'pago', 'preparando', 'pronto'])

  if (countError) return { error: 'Erro ao verificar pedidos do restaurante.' }
  if (count && count > 0) return { error: 'Não é possível excluir: há pedidos em andamento.' }

  const { error } = await supabaseAdmin.from('restaurants').delete().eq('id', id)
  if (error) return { error: error.message }

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: 'delete_restaurant', entityType: 'restaurant', entityId: id })

  // ✅ Retornar { success } em vez de redirect() — client faz o redirect via router.push()
  return { success: true }
}

export async function toggleStatus(id: string, currentStatus: string) {
  // ✅ plan_status conforme schema
  const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
  const { error } = await supabaseAdmin
    .from('restaurants')
    .update({ plan_status: newStatus })
    .eq('id', id)

  if (error) return { error: error.message }

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: newStatus === 'active' ? 'activate_restaurant' : 'suspend_restaurant', entityType: 'restaurant', entityId: id })

  revalidatePath(`/super-admin/restaurantes/${id}`)
  return { success: true }
}

export async function extendTrial(id: string, daysToAdd: number) {
  const { data: rest } = await supabaseAdmin
    .from('restaurants')
    .select('trial_ends_at')
    .eq('id', id)
    .single()

  const baseDate = rest?.trial_ends_at && new Date(rest.trial_ends_at) > new Date()
    ? new Date(rest.trial_ends_at)
    : new Date()

  const newTrialEndsAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000).toISOString()

  // ✅ plan_status conforme schema
  const { error } = await supabaseAdmin
    .from('restaurants')
    .update({ trial_ends_at: newTrialEndsAt, plan_status: 'trial' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath(`/super-admin/restaurantes/${id}`)
  return { success: true }
}

export async function removeUserFromRestaurant(profileId: string) {
  const { error } = await supabaseAdmin.from('profiles').delete().eq('id', profileId)
  if (error) return { error: error.message }
  return { success: true }
}

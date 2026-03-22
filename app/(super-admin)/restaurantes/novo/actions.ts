'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const createRestaurantSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  slug: z.string()
    .min(1, 'O slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  plan: z.enum(['basico', 'pro', 'ultra']).default('basico'),
  status: z.enum(['trial', 'active']).default('trial'),
  trialDays: z.coerce.number().min(0).optional(),
  gateway: z.enum(['pagarme', 'mercadopago']).default('pagarme'),
  fee: z.coerce.number().min(0, 'A taxa deve ser positiva'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Formato Hex inválido').default('#c8410a'),
  deliveryEnabled: z.boolean().default(false),
  tableMenuEnabled: z.boolean().default(true),
  adminName: z.string().min(1, 'O nome do admin é obrigatório'),
  adminEmail: z.string().email('E-mail inválido'),
  adminPassword: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
}).superRefine((data, ctx) => {
  if (data.status === 'trial' && (!data.trialDays || data.trialDays <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Defina os dias de trial',
      path: ['trialDays'],
    })
  }
})

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>

export async function createRestaurant(data: CreateRestaurantInput) {
  const parsed = createRestaurantSchema.safeParse(data)
  if (!parsed.success) {
    return { error: 'Dados inválidos. Verifique o formulário.' }
  }

  const values = parsed.data
  let createdRestaurantId: string | null = null
  let createdUserId: string | null = null

  try {
    const { data: existingSlug } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('slug', values.slug)
      .single()

    if (existingSlug) {
      return { error: 'Este slug já está em uso por outro restaurante.' }
    }

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: values.name,
        slug: values.slug,
        plan: values.plan,
        // ✅ plan_status conforme schema
        plan_status: values.status,
        trial_ends_at: values.status === 'trial'
          ? new Date(Date.now() + (values.trialDays || 14) * 24 * 60 * 60 * 1000).toISOString()
          : null,
        // ✅ Nomes corretos conforme schema
        payment_provider: values.gateway,
        platform_fee_pct: values.fee,
        color_primary: values.color,
        delivery_enabled: values.deliveryEnabled,
        table_enabled: values.tableMenuEnabled,
      })
      .select('id')
      .single()

    if (restaurantError || !restaurant) throw new Error(`Erro ao criar restaurante: ${restaurantError?.message}`)
    createdRestaurantId = restaurant.id

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: values.adminEmail,
      password: values.adminPassword,
      email_confirm: true,
      user_metadata: { full_name: values.adminName },
    })

    if (authError || !authData.user) throw new Error(`Erro ao criar admin auth: ${authError?.message}`)
    createdUserId = authData.user.id

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: createdUserId,
        full_name: values.adminName,
        role: 'restaurant_admin',
        restaurant_id: createdRestaurantId,
      })

    if (profileError) throw new Error(`Erro ao criar perfil do admin: ${profileError.message}`)

  } catch (err: any) {
    console.error('Falha na criação. Iniciando rollback...', err)

    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId)
    }
    if (createdRestaurantId) {
      await supabaseAdmin.from('restaurants').delete().eq('id', createdRestaurantId)
    }

    return { error: err.message || 'Ocorreu um erro inesperado ao criar o restaurante.' }
  }

  redirect(`/super-admin/restaurantes/${createdRestaurantId}?success=true`)
}

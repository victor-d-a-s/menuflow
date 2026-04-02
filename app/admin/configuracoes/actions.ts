'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const configSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  color_primary: z.string().default('#c8410a'),
  delivery_enabled: z.boolean(),
  table_enabled: z.boolean(),
})

export type ConfigInput = z.infer<typeof configSchema>

export async function updateRestaurantConfig(data: ConfigInput) {
  const { profile } = await getServerUser()
  if (!profile?.restaurant_id) return { error: 'Sem restaurante vinculado' }

  const parsed = configSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const { error } = await supabase
    .from('restaurants')
    .update({
      name: parsed.data.name,
      color_primary: parsed.data.color_primary,
      delivery_enabled: parsed.data.delivery_enabled,
      table_enabled: parsed.data.table_enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.restaurant_id)

  if (error) return { error: error.message }
  revalidatePath('/admin/configuracoes')
  return { success: true }
}

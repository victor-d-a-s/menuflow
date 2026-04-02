'use server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const schema = z.object({ name: z.string().min(1), color_primary: z.string().default('#c8410a'), delivery_enabled: z.boolean(), table_enabled: z.boolean() })
export type ConfigInput = z.infer<typeof schema>
export async function updateRestaurantConfig(data: ConfigInput) {
  const { profile } = await getServerUser()
  if (!profile?.restaurant_id) return { error: 'Sem restaurante' }
  const p = schema.safeParse(data); if (!p.success) return { error: 'Dados inválidos' }
  const { error } = await supabase.from('restaurants').update({ name: p.data.name, color_primary: p.data.color_primary, delivery_enabled: p.data.delivery_enabled, table_enabled: p.data.table_enabled, updated_at: new Date().toISOString() }).eq('id', profile.restaurant_id)
  if (error) return { error: error.message }
  revalidatePath('/admin/configuracoes'); return { success: true }
}

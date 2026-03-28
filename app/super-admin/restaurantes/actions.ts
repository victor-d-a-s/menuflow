'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function toggleRestaurantStatus(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string
  const currentStatus = formData.get('currentStatus') as string
  // ✅ Usando plan_status conforme o schema
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active'

  const { error } = await supabaseAdmin
    .from('restaurants')
    .update({ plan_status: newStatus })
    .eq('id', restaurantId)

  if (error) {
    console.error('Erro ao atualizar status do restaurante:', error)
    throw new Error('Falha ao atualizar o status.')
  }

  revalidatePath('/super-admin/restaurantes')
}

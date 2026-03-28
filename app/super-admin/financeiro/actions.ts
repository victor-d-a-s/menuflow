'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function reactivateSubscription(restaurantId: string) {
  // ✅ plan_status conforme schema
  const { error } = await supabaseAdmin
    .from('restaurants')
    .update({ plan_status: 'active' })
    .eq('id', restaurantId)

  if (error) return { error: error.message }

  revalidatePath('/super-admin/financeiro')
  return { success: true }
}

'use server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function updateOrderStatus(orderId: string, status: string, restaurantId: string) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId).eq('restaurant_id', restaurantId)
  if (error) return { error: error.message }
  revalidatePath('/admin/pedidos')
  return { success: true }
}

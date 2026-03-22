'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function cancelOrder(orderId: string) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelado' })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath(`/super-admin/pedidos/${orderId}`)
  return { success: true }
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath(`/super-admin/pedidos/${orderId}`)
  return { success: true }
}

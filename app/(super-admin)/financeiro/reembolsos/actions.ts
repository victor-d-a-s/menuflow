'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getServerUser } from '@/lib/supabase/server'
import { getPaymentGateway } from '@/lib/payment/factory'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function findOrderForRefund(query: string) {
  if (!query.trim()) return { error: 'Digite um ID de pedido ou Payment ID.' }

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, total, status, payment_id, payment_provider, created_at, customer_name,
      restaurants(id, name),
      order_items(id, product_name, quantity, unit_price)
    `)
    .or(`id.eq.${query},payment_id.eq.${query}`)
    .single()

  if (error || !order) return { error: 'Pedido não encontrado.' }
  return { order }
}

export const refundSchema = z.object({
  orderId: z.string().uuid(),
  paymentId: z.string().min(1),
  paymentProvider: z.string().min(1),
  amountCents: z.number().min(1),
  reason: z.enum(['erro_sistema', 'solicitacao_cliente', 'produto_indisponivel', 'outro']),
  notes: z.string().optional(),
})

export type RefundInput = z.infer<typeof refundSchema>

export async function processRefund(data: RefundInput) {
  const { user } = await getServerUser()
  if (!user) return { error: 'Não autorizado.' }

  const parsed = refundSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { orderId, paymentId, paymentProvider, amountCents, reason, notes } = parsed.data

  try {
    const gateway = getPaymentGateway(paymentProvider)

    // ✅ gateway.refund() retorna Promise<boolean> conforme a interface PaymentGateway
    const refundSuccess = await gateway.refund(paymentId, amountCents)
    if (!refundSuccess) {
      throw new Error('Falha ao processar o estorno no gateway de pagamento.')
    }

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'cancelado' })
      .eq('id', orderId)

    if (updateError) throw new Error(`Falha ao atualizar status: ${updateError.message}`)

    const { error: insertError } = await supabaseAdmin
      .from('refunds')
      .insert({
        order_id: orderId,
        amount: amountCents,
        reason,
        notes,
        created_by: user.id,
      })

    if (insertError) throw new Error(`Falha ao registrar histórico: ${insertError.message}`)

    // TODO: adicionar logAction aqui
    // await logAction({ adminId: user.id, action: 'process_refund', entityType: 'order', entityId: orderId, details: { amountCents, reason, paymentId } })

  } catch (err: any) {
    return { error: err.message || 'Erro inesperado ao processar o reembolso.' }
  }

  revalidatePath('/super-admin/financeiro/reembolsos')
  return { success: true }
}

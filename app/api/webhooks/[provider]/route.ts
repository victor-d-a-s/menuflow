export const runtime = "edge";
export const dynamic = "force-dynamic";
// ✅ next/server (não next/response)
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = process.env.NEXT_PUBLIC_SUPABASE_URL ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!) : null as any;


export async function POST(
  req: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider
  let rawBody = ''
  let payload: any = {}
  let eventType = 'unknown'
  let signatureValid = false
  let orderId: string | null = null

  try {
    rawBody = await req.text()
    payload = JSON.parse(rawBody)

    if (provider === 'stripe') eventType = payload.type
    if (provider === 'pagarme') eventType = payload.type
    if (provider === 'mercadopago') eventType = payload.action || payload.type

    const signature = req.headers.get('stripe-signature') || req.headers.get('x-pagarme-signature')
    if (signature) {
      // Aqui você chamaria a validação real do gateway:
      // ex: stripe.webhooks.constructEvent(rawBody, signature, secret)
      signatureValid = true
    }

    if (!signatureValid) {
      throw new Error('Assinatura do webhook inválida ou ausente.')
    }

    // Processamento real do evento (adaptar conforme o provider)
    // orderId = extrair do payload conforme estrutura do gateway

    await supabaseAdmin.from('webhook_logs').insert({
      provider,
      event_type: eventType,
      payload,
      signature_valid: signatureValid,
      status: 'processed',
      order_id: orderId || null,
    })

    return NextResponse.json({ received: true, status: 'processed' })

  } catch (err: any) {
    console.error(`[Webhook Error - ${provider}]:`, err.message)

    await supabaseAdmin.from('webhook_logs').insert({
      provider,
      event_type: eventType,
      payload: Object.keys(payload).length ? payload : { raw: rawBody },
      signature_valid: signatureValid,
      status: 'failed',
      error_message: err.message || 'Erro desconhecido',
      order_id: orderId || null,
    })

    const status = err.message.includes('Assinatura') ? 400 : 500
    return NextResponse.json({ error: err.message }, { status })
  }
}

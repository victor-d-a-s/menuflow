import { createClient } from '@supabase/supabase-js'

/*
-- SQL para criar a tabela de auditoria (Execute no SQL Editor do Supabase)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
*/

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type LogActionParams = {
  adminId: string
  action: string
  entityType: 'restaurant' | 'user' | 'order' | 'plan' | 'setting' | 'other'
  entityId: string
  details?: Record<string, any>
  request?: Request
}

/**
 * Registra uma ação administrativa no log de auditoria.
 *
 * Exemplos de uso:
 * await logAction({ adminId: profile.id, action: 'suspend_restaurant', entityType: 'restaurant', entityId: restaurantId, details: { reason: 'inadimplencia' } })
 * await logAction({ adminId: profile.id, action: 'delete_user', entityType: 'user', entityId: userId })
 * await logAction({ adminId: profile.id, action: 'update_plan', entityType: 'restaurant', entityId: restaurantId, details: { from: 'basico', to: 'pro' } })
 */
export async function logAction({ adminId, action, entityType, entityId, details, request }: LogActionParams) {
  try {
    let ipAddress: string | null = null

    if (request) {
      ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    } else {
      try {
        const { headers } = await import('next/headers')
        // ✅ headers() é assíncrono no Next.js 15
        const headersList = await headers()
        ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip')
      } catch {
        // Ignora caso next/headers não esteja disponível no contexto
      }
    }

    // Limpa o IP caso venha com múltiplas origens (ex: "ip1, ip2")
    if (ipAddress && ipAddress.includes(',')) {
      ipAddress = ipAddress.split(',')[0].trim()
    }

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: adminId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
      ip_address: ipAddress,
    })
  } catch (error) {
    // Falha silenciosa — o log nunca deve quebrar a aplicação principal
    console.error('[Audit Log Error]: Falha ao registrar ação ->', error)
  }
}

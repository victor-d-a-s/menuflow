'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function updatePlatformSetting(key: string, value: string) {
  const { error } = await supabaseAdmin
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) return { error: error.message }

  revalidatePath('/super-admin/configuracoes')
  return { success: true }
}

export async function forceSyncAllRoles() {
  const { data: profiles, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')

  if (fetchError) return { error: 'Falha ao buscar usuários para sincronização.' }

  let successCount = 0
  for (const profile of profiles) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      user_metadata: { role_sync_ts: Date.now() },
    })
    if (!error) successCount++
  }

  return { success: true, count: successCount }
}

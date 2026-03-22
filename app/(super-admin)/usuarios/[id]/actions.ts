'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const updateUserSchema = z.object({
  fullName: z.string().min(1, 'O nome é obrigatório'),
  role: z.enum(['super_admin', 'restaurant_admin', 'kitchen']),
  restaurantId: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.role !== 'super_admin' && (!data.restaurantId || data.restaurantId === 'none')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Restaurante é obrigatório para este cargo',
      path: ['restaurantId'],
    })
  }
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

export async function updateUserProfile(profileId: string, data: UpdateUserInput) {
  const parsed = updateUserSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const values = parsed.data
  const finalRestaurantId = values.role === 'super_admin' ? null : values.restaurantId

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name: values.fullName,
      role: values.role,
      restaurant_id: finalRestaurantId,
    })
    .eq('id', profileId)

  if (error) return { error: error.message }

  // Sincroniza o nome no user_metadata do Auth
  await supabaseAdmin.auth.admin.updateUserById(profileId, {
    user_metadata: { full_name: values.fullName },
  })

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: 'update_user', entityType: 'user', entityId: profileId, details: { role: values.role } })

  revalidatePath(`/super-admin/usuarios/${profileId}`)
  return { success: true }
}

export async function resetPassword(authUserId: string, newPassword: string) {
  if (newPassword.length < 8) return { error: 'A senha deve ter no mínimo 8 caracteres.' }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, { password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleBan(authUserId: string, isCurrentlyBanned: boolean) {
  const banDuration = isCurrentlyBanned ? 'none' : '876600h'

  const { error } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
    ban_duration: banDuration,
  })

  if (error) return { error: error.message }

  revalidatePath(`/super-admin/usuarios/${authUserId}`)
  return { success: true }
}

export async function deleteUser(authUserId: string) {
  await supabaseAdmin.from('profiles').delete().eq('id', authUserId)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId)
  if (error) return { error: error.message }

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: 'delete_user', entityType: 'user', entityId: authUserId })

  // ✅ Retornar { success } em vez de redirect() — client faz o redirect via router.push()
  return { success: true }
}

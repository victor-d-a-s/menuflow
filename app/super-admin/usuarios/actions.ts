'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const createUserSchema = z.object({
  fullName: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['super_admin', 'restaurant_admin', 'kitchen']),
  restaurantId: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.role !== 'super_admin' && (!data.restaurantId || data.restaurantId === 'none')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Restaurante é obrigatório para este cargo',
      path: ['restaurantId'],
    })
  }
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export async function createUser(data: CreateUserInput) {
  const parsed = createUserSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const values = parsed.data
  let createdUserId: string | null = null

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: values.email,
      password: values.password,
      email_confirm: true,
      user_metadata: { full_name: values.fullName },
    })

    if (authError || !authData.user) throw new Error(`Erro Auth: ${authError?.message}`)
    createdUserId = authData.user.id

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: createdUserId,
        full_name: values.fullName,
        role: values.role,
        restaurant_id: values.role === 'super_admin' ? null : values.restaurantId,
      })

    if (profileError) throw new Error(`Erro Perfil: ${profileError.message}`)

  } catch (err: any) {
    if (createdUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserId)
    }
    return { error: err.message || 'Falha ao criar usuário.' }
  }

  revalidatePath('/super-admin/usuarios')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await supabaseAdmin.from('profiles').delete().eq('id', userId)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  // TODO: adicionar logAction aqui
  // await logAction({ adminId: currentAdminId, action: 'delete_user', entityType: 'user', entityId: userId })

  revalidatePath('/super-admin/usuarios')
  return { success: true }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  if (newPassword.length < 8) return { error: 'A nova senha deve ter no mínimo 8 caracteres.' }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

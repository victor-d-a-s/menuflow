// FILE: app/(super-admin)/restaurantes/[id]/cardapio/actions.ts
'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço inválido'),
  category_id: z.string().uuid('Categoria inválida'),
  active: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>

export async function createCategory(restaurantId: string, name: string, sortOrder: number) {
  const { error } = await supabaseAdmin
    .from('categories')
    .insert({ restaurant_id: restaurantId, name, sort_order: sortOrder })
  if (error) return { error: error.message }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

export async function updateCategory(id: string, restaurantId: string, name: string) {
  const { error } = await supabaseAdmin.from('categories').update({ name }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

export async function updateCategoryOrders(restaurantId: string, updates: { id: string; sort_order: number }[]) {
  for (const update of updates) {
    await supabaseAdmin.from('categories').update({ sort_order: update.sort_order }).eq('id', update.id)
  }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

export async function deleteCategory(id: string, restaurantId: string) {
  const { count } = await supabaseAdmin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    return { error: 'Não é possível excluir: existem produtos vinculados a esta categoria.' }
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

export async function createProduct(restaurantId: string, data: ProductInput) {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const { error } = await supabaseAdmin.from('products').insert({
    restaurant_id: restaurantId,
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: Math.round(parsed.data.price * 100),
    active: parsed.data.active,
  })
  if (error) return { error: error.message }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

export async function updateProduct(id: string, restaurantId: string, data: ProductInput) {
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }

  const { error } = await supabaseAdmin.from('products').update({
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: Math.round(parsed.data.price * 100),
    active: parsed.data.active,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

export async function toggleProductActive(id: string, restaurantId: string, active: boolean) {
  const { error } = await supabaseAdmin.from('products').update({ active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

export async function deleteProduct(id: string, restaurantId: string) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/super-admin/restaurantes/${restaurantId}/cardapio`)
  return { success: true }
}

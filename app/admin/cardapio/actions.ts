'use server'

import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getRestaurantId() {
  const { profile } = await getServerUser()
  if (!profile?.restaurant_id) throw new Error('Sem restaurante vinculado')
  return profile.restaurant_id
}

// CATEGORIAS
export async function createCategory(name: string, sortOrder: number) {
  const rid = await getRestaurantId()
  const { error } = await supabase.from('categories').insert({ restaurant_id: rid, name, sort_order: sortOrder })
  if (error) return { error: error.message }
  revalidatePath('/admin/cardapio')
  return { success: true }
}

export async function updateCategory(id: string, name: string) {
  const rid = await getRestaurantId()
  const { error } = await supabase.from('categories').update({ name }).eq('id', id).eq('restaurant_id', rid)
  if (error) return { error: error.message }
  revalidatePath('/admin/cardapio')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const rid = await getRestaurantId()
  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', id)
  if (count && count > 0) return { error: 'Remova os produtos desta categoria antes de excluí-la.' }
  const { error } = await supabase.from('categories').delete().eq('id', id).eq('restaurant_id', rid)
  if (error) return { error: error.message }
  revalidatePath('/admin/cardapio')
  return { success: true }
}

// PRODUTOS
const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  category_id: z.string().uuid(),
  active: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>

export async function createProduct(data: ProductInput) {
  const rid = await getRestaurantId()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }
  const { error } = await supabase.from('products').insert({
    restaurant_id: rid,
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: Math.round(parsed.data.price * 100),
    active: parsed.data.active,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/cardapio')
  return { success: true }
}

export async function updateProduct(id: string, data: ProductInput) {
  const rid = await getRestaurantId()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { error: 'Dados inválidos' }
  const { error } = await supabase.from('products').update({
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: Math.round(parsed.data.price * 100),
    active: parsed.data.active,
  }).eq('id', id).eq('restaurant_id', rid)
  if (error) return { error: error.message }
  revalidatePath('/admin/cardapio')
  return { success: true }
}

export async function toggleProduct(id: string, active: boolean) {
  const rid = await getRestaurantId()
  const { error } = await supabase.from('products').update({ active }).eq('id', id).eq('restaurant_id', rid)
  if (error) return { error: error.message }
  revalidatePath('/admin/cardapio')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const rid = await getRestaurantId()
  const { error } = await supabase.from('products').delete().eq('id', id).eq('restaurant_id', rid)
  if (error) return { error: error.message }
  revalidatePath('/admin/cardapio')
  return { success: true }
}

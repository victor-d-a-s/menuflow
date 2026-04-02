'use server'
import { createClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
async function getRid() { const { profile } = await getServerUser(); if (!profile?.restaurant_id) throw new Error('Sem restaurante'); return profile.restaurant_id }
export async function createTable(nameOrNumber: string) { const rid = await getRid(); const qrCode = `${rid}-${nameOrNumber.toLowerCase().replace(/\s+/g,'-')}-${Date.now()}`; const { error } = await supabase.from('tables').insert({ restaurant_id: rid, name_or_number: nameOrNumber, qr_code: qrCode, active: true }); if (error) return { error: error.message }; revalidatePath('/admin/mesas'); return { success: true } }
export async function toggleTable(id: string, active: boolean) { const rid = await getRid(); const { error } = await supabase.from('tables').update({ active }).eq('id', id).eq('restaurant_id', rid); if (error) return { error: error.message }; revalidatePath('/admin/mesas'); return { success: true } }
export async function deleteTable(id: string) { const rid = await getRid(); const { error } = await supabase.from('tables').delete().eq('id', id).eq('restaurant_id', rid); if (error) return { error: error.message }; revalidatePath('/admin/mesas'); return { success: true } }

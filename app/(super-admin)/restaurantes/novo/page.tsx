'use client';
export const runtime = 'edge';
'use client';
'use client';
export const runtime = 'edge';
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateRestaurantForm } from './components/create-restaurant-form'
import { Building2 } from 'lucide-react'

export const metadata = {
  title: 'Novo Restaurante | Super Admin',
}

export default async function NovoRestaurantePage() {
  // ✅ getServerUser() retorna { user, profile } — sem dupla query
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Restaurante</h1>
          <p className="text-muted-foreground">Adicione um novo estabelecimento e crie a conta administrativa.</p>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-6 shadow-sm">
        <CreateRestaurantForm />
      </div>
    </div>
  )
}

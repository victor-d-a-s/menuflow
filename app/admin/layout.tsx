export const runtime = 'edge'

import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { AdminSidebar } from '@/components/admin/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getServerUser()

  if (!user) redirect('/login')
  if (profile?.role !== 'restaurant_admin') redirect('/unauthorized')
  if (!profile.restaurant_id) redirect('/unauthorized')

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('name, plan, plan_status')
    .eq('id', profile.restaurant_id)
    .single()

  if (!restaurant || restaurant.plan_status === 'suspended') redirect('/unauthorized')

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AdminSidebar
        restaurantName={restaurant.name}
        adminName={profile.full_name}
        plan={restaurant.plan}
      />
      <main className="lg:pl-64 pt-14 lg:pt-0 min-h-screen">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}

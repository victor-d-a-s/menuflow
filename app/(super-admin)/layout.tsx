export const runtime = 'edge'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/super-admin/Sidebar'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ getServerUser() já retorna { user, profile } — sem dupla query ao banco
  const { user, profile } = await getServerUser()

  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  const adminName = profile.full_name || 'Admin MenuFlow'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar adminName={adminName} />
      <main className="lg:pl-[260px] pt-16 lg:pt-0 min-h-screen">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  )
}

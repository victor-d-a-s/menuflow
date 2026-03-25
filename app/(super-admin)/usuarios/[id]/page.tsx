export const runtime = 'edge';
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Mail, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { UserDetailClient } from './components/user-detail-client'

export default async function DetalheUsuarioPage({ params }: { params: { id: string } }) {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile: currentProfile } = await getServerUser()
  if (!user) redirect('/login')
  if (currentProfile?.role !== 'super_admin') redirect('/unauthorized')

  // ✅ createAdminClient separado do createClient SSR
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: targetProfile },
    { data: authResponse, error: authError },
    { data: restaurants },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*, restaurants(id, name)').eq('id', params.id).single(),
    supabaseAdmin.auth.admin.getUserById(params.id),
    supabaseAdmin.from('restaurants').select('id, name').order('name'),
  ])

  if (!targetProfile || authError || !authResponse?.user) {
    notFound()
  }

  const authUser = authResponse.user
  const isBanned = !!authUser.banned_until && new Date(authUser.banned_until) > new Date()

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <Badge variant="destructive" className="bg-red-500/10 text-red-500">Super Admin</Badge>
      case 'restaurant_admin': return <Badge variant="default" className="bg-blue-500/10 text-blue-500">Admin</Badge>
      case 'kitchen': return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500">Cozinha</Badge>
      default: return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" asChild className="mt-1">
            <Link href="/super-admin/usuarios"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold tracking-tight">{targetProfile.full_name}</h1>
              {getRoleBadge(targetProfile.role)}
              {isBanned && <Badge variant="destructive">Bloqueado</Badge>}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              ID: <span className="font-mono text-xs">{targetProfile.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Info do Auth (Leitura) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-muted/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-background rounded-full"><Mail className="w-4 h-4 text-muted-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Email de Login</p>
              <p className="text-sm font-semibold truncate max-w-[180px]" title={authUser.email}>{authUser.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-background rounded-full">
              {authUser.email_confirmed_at
                ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                : <XCircle className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Status do Email</p>
              <p className="text-sm font-semibold">{authUser.email_confirmed_at ? 'Confirmado' : 'Pendente'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-none shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-background rounded-full"><Clock className="w-4 h-4 text-muted-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Último Login</p>
              <p className="text-sm font-semibold">
                {authUser.last_sign_in_at
                  ? new Date(authUser.last_sign_in_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : 'Nunca acessou'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-none shadow-none">
          <CardContent className="p-4 flex flex-col justify-center h-full">
            <p className="text-xs text-muted-foreground font-medium mb-1">Restaurante Vinculado</p>
            {targetProfile.role === 'super_admin' ? (
              <span className="text-sm font-semibold text-muted-foreground">Acesso Global</span>
            ) : targetProfile.restaurants ? (
              <Link href={`/super-admin/restaurantes/${targetProfile.restaurants.id}`} className="text-sm font-semibold text-blue-600 hover:underline truncate">
                {targetProfile.restaurants.name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-amber-600">Nenhum vínculo</span>
            )}
          </CardContent>
        </Card>
      </div>

      <UserDetailClient
        profile={targetProfile}
        authUser={authUser as any}
        restaurants={restaurants || []}
        isBanned={isBanned}
      />
    </div>
  )
}

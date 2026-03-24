'use client';
export const runtime = 'edge';
'use client';
'use client';
export const runtime = 'edge';
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UsersRound } from 'lucide-react'
import { NewUserDialog, UserFilters, UserRowActions } from './components/user-management'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  // ✅ getServerUser() retorna { user, profile }
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  // ✅ supabaseAdmin para ignorar RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: restaurants } = await supabaseAdmin
    .from('restaurants')
    .select('id, name')
    .order('name')

  const limit = 25
  const page = parseInt(searchParams.pagina || '1')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin
    .from('profiles')
    .select('*, restaurants(id, name)', { count: 'exact' })

  if (searchParams.busca) query = query.ilike('full_name', `%${searchParams.busca}%`)
  if (searchParams.role && searchParams.role !== 'todos') query = query.eq('role', searchParams.role)
  if (searchParams.restaurante && searchParams.restaurante !== 'todos') query = query.eq('restaurant_id', searchParams.restaurante)

  const { data: users, count, error } = await query
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) console.error('Erro ao buscar usuários:', error)

  const totalPages = Math.ceil((count || 0) / limit)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-none border-red-200">Super Admin</Badge>
      case 'restaurant_admin': return <Badge variant="default" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 shadow-none border-blue-200">Admin</Badge>
      case 'kitchen': return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-none border-emerald-200">Cozinha</Badge>
      default: return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg"><UsersRound className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
            <p className="text-muted-foreground">Gerencie o acesso de toda a plataforma.</p>
          </div>
        </div>
        <NewUserDialog restaurants={restaurants || []} />
      </div>

      <UserFilters restaurants={restaurants || []} />

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Restaurante</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!users || users.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>
                    {u.role === 'super_admin' ? (
                      <span className="text-muted-foreground">—</span>
                    ) : u.restaurants ? (
                      <Link href={`/super-admin/restaurantes/${u.restaurants.id}`} className="hover:underline text-blue-600 font-medium">
                        {u.restaurants.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Sem vínculo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><UserRowActions user={u} /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span> ({count} registros)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} asChild>
              <Link href={`?${new URLSearchParams({ ...searchParams, pagina: (page - 1).toString() })}`}>Anterior</Link>
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
              <Link href={`?${new URLSearchParams({ ...searchParams, pagina: (page + 1).toString() })}`}>Próxima</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

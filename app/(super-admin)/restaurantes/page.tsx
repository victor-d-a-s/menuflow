export const runtime = 'edge';
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Building2, Eye, PauseCircle, PlayCircle, Plus, UserCog } from 'lucide-react'
import { toggleRestaurantStatus } from './actions'
import { RestaurantFilters } from './components/restaurant-filters'

export const dynamic = 'force-dynamic'

export default async function RestaurantesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  // ✅ getServerUser() retorna { user, profile } — sem dupla query
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  // ✅ supabaseAdmin para ignorar RLS e garantir acesso total
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const limit = 20
  const page = parseInt(searchParams.pagina || '1')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin
    .from('restaurants')
    .select('*', { count: 'exact' })

  if (searchParams.busca) {
    query = query.ilike('name', `%${searchParams.busca}%`)
  }
  if (searchParams.plano && searchParams.plano !== 'todos') {
    query = query.eq('plan', searchParams.plano)
  }
  // ✅ Filtra por plan_status conforme o schema
  if (searchParams.status && searchParams.status !== 'todos') {
    query = query.eq('plan_status', searchParams.status)
  }

  const { data: restaurants, count, error } = await query
    .range(from, to)
    .order('created_at', { ascending: false })

  if (error) console.error('Erro ao buscar restaurantes:', error)

  const totalPages = Math.ceil((count || 0) / limit)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Ativo</Badge>
      case 'suspended': return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Suspenso</Badge>
      case 'trial': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Trial</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'ultra': return <Badge variant="outline" className="border-amber-500 text-amber-500">Ultra</Badge>
      case 'pro': return <Badge variant="outline" className="border-purple-500 text-purple-500">Pro</Badge>
      default: return <Badge variant="outline">Básico</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurantes</h1>
          <p className="text-muted-foreground">Gerencie todos os estabelecimentos do MenuFlow.</p>
        </div>
        <Button asChild>
          <Link href="/super-admin/restaurantes/novo">
            <Plus className="w-4 h-4 mr-2" />
            Novo Restaurante
          </Link>
        </Button>
      </div>

      <RestaurantFilters />

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!restaurants || restaurants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Building2 className="h-10 w-10 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Nenhum restaurante encontrado</p>
                    <p className="text-sm">Tente ajustar seus filtros ou cadastre um novo.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              restaurants.map((rest) => (
                <TableRow key={rest.id}>
                  <TableCell className="font-medium">{rest.name}</TableCell>
                  <TableCell className="text-muted-foreground">{rest.slug}</TableCell>
                  <TableCell>{getPlanBadge(rest.plan)}</TableCell>
                  {/* ✅ plan_status conforme schema */}
                  <TableCell>{getStatusBadge(rest.plan_status)}</TableCell>
                  <TableCell>{new Date(rest.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild title="Ver detalhes">
                        <Link href={`/super-admin/restaurantes/${rest.id}`}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </Button>

                      <form action={toggleRestaurantStatus}>
                        <input type="hidden" name="restaurantId" value={rest.id} />
                        {/* ✅ plan_status conforme schema */}
                        <input type="hidden" name="currentStatus" value={rest.plan_status} />
                        <Button
                          variant="ghost"
                          size="icon"
                          type="submit"
                          title={rest.plan_status === 'active' ? 'Suspender' : 'Ativar'}
                        >
                          {rest.plan_status === 'active' ? (
                            <PauseCircle className="h-4 w-4 text-red-500" />
                          ) : (
                            <PlayCircle className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </TableCell>
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

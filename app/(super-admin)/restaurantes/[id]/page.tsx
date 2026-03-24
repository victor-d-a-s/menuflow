'use client';
'use client';
export const runtime = 'edge';
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getServerUser } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { CalendarDays, DollarSign, Store, ShoppingBag } from 'lucide-react'
import { EditRestaurantForm, RestaurantHeaderActions } from './components/client-components'

export default async function RestauranteDetalhePage({ params }: { params: { id: string } }) {
  // ✅ getServerUser() retorna { user, profile } — sem dupla query
  const { user, profile } = await getServerUser()
  if (!user) redirect('/login')
  if (profile?.role !== 'super_admin') redirect('/unauthorized')

  // ✅ supabaseAdmin para queries sem restrição de RLS
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { data: restaurant },
    { data: users },
    { data: recentOrders },
  ] = await Promise.all([
    supabaseAdmin.from('restaurants').select('*').eq('id', params.id).single(),
    supabaseAdmin.from('profiles').select('*').eq('restaurant_id', params.id),
    supabaseAdmin.from('orders').select('*').eq('restaurant_id', params.id)
      .order('created_at', { ascending: false }).limit(10),
  ])

  if (!restaurant) notFound()

  // ✅ Campo total em centavos (não total_amount)
  const totalOrdersMonth = recentOrders?.length || 0
  const grossRevenueCents = recentOrders?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0
  const grossRevenue = grossRevenueCents / 100
  const platformFeeCollected = grossRevenue * ((restaurant.platform_fee_pct || 0) / 100)

  let trialDaysLeft = 0
  // ✅ plan_status conforme schema
  if (restaurant.plan_status === 'trial' && restaurant.trial_ends_at) {
    const diffTime = Math.max(0, new Date(restaurant.trial_ends_at).getTime() - new Date().getTime())
    trialDaysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg border">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <Badge variant="outline" className="uppercase">{restaurant.plan}</Badge>
            {/* ✅ plan_status */}
            <Badge variant={restaurant.plan_status === 'active' ? 'default' : restaurant.plan_status === 'trial' ? 'secondary' : 'destructive'}>
              {restaurant.plan_status}
            </Badge>
          </div>
          <p className="text-muted-foreground">/{restaurant.slug}</p>
        </div>
        <RestaurantHeaderActions restaurant={restaurant} />
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdersMonth}</div>
            <p className="text-xs text-muted-foreground">Últimos 10</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Bruto</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(grossRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa Plataforma</CardTitle>
            <Store className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(platformFeeCollected)}</div>
            <p className="text-xs text-muted-foreground">{restaurant.platform_fee_pct}% aplicado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status / Cadastro</CardTitle>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{new Date(restaurant.created_at).toLocaleDateString('pt-BR')}</div>
            {restaurant.plan_status === 'trial' && (
              <p className="text-xs text-blue-600 font-medium">{trialDaysLeft} dias restantes de trial</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="config" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto bg-transparent p-0 mb-6">
          <TabsTrigger value="config" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Configurações</TabsTrigger>
          <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Usuários</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">Últimos Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <EditRestaurantForm restaurant={restaurant} />
        </TabsContent>

        <TabsContent value="users" className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users || users.length === 0
                ? <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Nenhum usuário encontrado.</TableCell></TableRow>
                : users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="ghost" size="sm">Editar</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">Remover</Button>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="orders" className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!recentOrders || recentOrders.length === 0
                ? <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum pedido recente.</TableCell></TableRow>
                : recentOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id.slice(0, 6)}</TableCell>
                    <TableCell>{order.type}</TableCell>
                    <TableCell><Badge variant="outline">{order.status}</Badge></TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleString('pt-BR')}</TableCell>
                    {/* ✅ total em centavos */}
                    <TableCell className="text-right font-medium">{formatCurrency((order.total || 0) / 100)}</TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  )
}

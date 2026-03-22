'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateRestaurant, deleteRestaurant, toggleStatus, updateRestaurantSchema, type UpdateRestaurantInput } from '../actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Loader2, Trash2, PauseCircle, PlayCircle } from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  slug: string
  plan: string
  plan_status: string
  color_primary: string
  platform_fee_pct: number
  payment_provider: string
  pagarme_recipient_id?: string
  stripe_customer_id?: string
  delivery_enabled: boolean
  table_enabled: boolean
  created_at: string
  trial_ends_at?: string
}

// --- BOTÕES DO HEADER ---
export function RestaurantHeaderActions({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // ✅ plan_status reativo após ação
  const [currentStatus, setCurrentStatus] = useState(restaurant.plan_status)

  const handleToggleStatus = () => {
    startTransition(async () => {
      const res = await toggleStatus(restaurant.id, currentStatus)
      if (res?.error) toast.error(res.error)
      else {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
        setCurrentStatus(newStatus)
        toast.success(`Restaurante ${newStatus === 'active' ? 'ativado' : 'suspenso'} com sucesso!`)
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteRestaurant(restaurant.id)
      if (res?.error) toast.error(res.error)
      // ✅ router.push() no client em vez de redirect() na server action
      else router.push('/super-admin/restaurantes')
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={currentStatus === 'suspended' ? 'default' : 'secondary'}
        onClick={handleToggleStatus}
        disabled={isPending}
      >
        {currentStatus === 'suspended'
          ? <><PlayCircle className="w-4 h-4 mr-2" />Ativar</>
          : <><PauseCircle className="w-4 h-4 mr-2" />Suspender</>
        }
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={isPending}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o restaurante <b>{restaurant.name}</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// --- FORMULÁRIO DE EDIÇÃO ---
export function EditRestaurantForm({ restaurant }: { restaurant: Restaurant }) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdateRestaurantInput>({
    resolver: zodResolver(updateRestaurantSchema),
    defaultValues: {
      name: restaurant.name || '',
      slug: restaurant.slug || '',
      // ✅ color_primary conforme schema
      color_primary: restaurant.color_primary || '#c8410a',
      delivery_enabled: restaurant.delivery_enabled ?? false,
      // ✅ table_enabled conforme schema
      table_enabled: restaurant.table_enabled ?? true,
      // ✅ payment_provider conforme schema
      payment_provider: (restaurant.payment_provider as any) || 'pagarme',
      plan: (restaurant.plan as any) || 'basico',
      // ✅ plan_status conforme schema
      plan_status: (restaurant.plan_status as any) || 'active',
      // ✅ platform_fee_pct conforme schema
      platform_fee_pct: restaurant.platform_fee_pct || 0,
      pagarme_recipient_id: restaurant.pagarme_recipient_id || '',
      stripe_customer_id: restaurant.stripe_customer_id || '',
    },
  })

  const onSubmit = (data: UpdateRestaurantInput) => {
    startTransition(async () => {
      const result = await updateRestaurant(restaurant.id, data)
      if (result?.error) toast.error(result.error)
      else toast.success('Configurações atualizadas com sucesso!')
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-card">
          <h3 className="col-span-full text-lg font-semibold">Informações Básicas</h3>
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="slug" render={({ field }) => (
            <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          {/* ✅ color_primary */}
          <FormField control={form.control} name="color_primary" render={({ field }) => (
            <FormItem><FormLabel>Cor Primária</FormLabel>
              <div className="flex gap-2">
                <FormControl><Input type="color" className="w-12 p-1 h-10" {...field} /></FormControl>
                <FormControl><Input className="flex-1" {...field} /></FormControl>
              </div><FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-card">
          <h3 className="col-span-full text-lg font-semibold">Configurações e Plano</h3>
          <FormField control={form.control} name="plan" render={({ field }) => (
            <FormItem><FormLabel>Plano</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="basico">Básico</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="ultra">Ultra</SelectItem>
                </SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          {/* ✅ plan_status */}
          <FormField control={form.control} name="plan_status" render={({ field }) => (
            <FormItem><FormLabel>Status do Plano</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          {/* ✅ platform_fee_pct */}
          <FormField control={form.control} name="platform_fee_pct" render={({ field }) => (
            <FormItem><FormLabel>Taxa da Plataforma (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <div className="col-span-full flex gap-6 pt-4 border-t">
            <FormField control={form.control} name="delivery_enabled" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">Delivery Ativo</FormLabel>
              </FormItem>
            )} />
            {/* ✅ table_enabled */}
            <FormField control={form.control} name="table_enabled" render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                <FormLabel className="!mt-0">Cardápio de Mesa Ativo</FormLabel>
              </FormItem>
            )} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-card">
          <h3 className="col-span-full text-lg font-semibold">Integrações Financeiras</h3>
          {/* ✅ payment_provider */}
          <FormField control={form.control} name="payment_provider" render={({ field }) => (
            <FormItem className="col-span-full md:col-span-1"><FormLabel>Gateway Padrão</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="pagarme">Pagar.me</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
          <div className="col-span-full grid md:grid-cols-2 gap-4">
            <FormField control={form.control} name="pagarme_recipient_id" render={({ field }) => (
              <FormItem><FormLabel>Pagar.me Recipient ID</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="stripe_customer_id" render={({ field }) => (
              <FormItem><FormLabel>Stripe Customer ID</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  )
}

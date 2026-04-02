'use client'
export const runtime = 'edge'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateRestaurantConfig, type ConfigInput } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Loader2, Store, Clock, CreditCard } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1),
  color_primary: z.string().default('#c8410a'),
  delivery_enabled: z.boolean(),
  table_enabled: z.boolean(),
})

type Restaurant = {
  name: string
  slug: string
  plan: string
  plan_status: string
  color_primary: string
  delivery_enabled: boolean
  table_enabled: boolean
  trial_ends_at?: string
  payment_provider?: string
}

const planLabel: Record<string, string> = { basico: 'Básico', pro: 'Pro', ultra: 'Ultra' }
const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-700',
  trial: 'bg-blue-500/10 text-blue-700',
  suspended: 'bg-red-500/10 text-red-700',
}
const statusLabel: Record<string, string> = { active: 'Ativo', trial: 'Trial', suspended: 'Suspenso' }

export function ConfigForm({ restaurant }: { restaurant: Restaurant }) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ConfigInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: restaurant.name,
      color_primary: restaurant.color_primary || '#c8410a',
      delivery_enabled: restaurant.delivery_enabled,
      table_enabled: restaurant.table_enabled,
    },
  })

  const onSubmit = (data: ConfigInput) => {
    startTransition(async () => {
      const res = await updateRestaurantConfig(data)
      if (res.error) toast.error(res.error)
      else toast.success('Configurações salvas!')
    })
  }

  const trialDaysLeft = restaurant.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(restaurant.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  return (
    <div className="space-y-6">
      {/* Info do Plano */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Store className="w-5 h-5 text-[#c8410a]" /> Informações do Plano
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs mb-1">Plano Atual</p>
            <Badge variant="outline" className="font-semibold">{planLabel[restaurant.plan] || restaurant.plan}</Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Status</p>
            <Badge className={`shadow-none ${statusColor[restaurant.plan_status] || ''}`}>
              {statusLabel[restaurant.plan_status] || restaurant.plan_status}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground text-xs mb-1">Slug (URL)</p>
            <code className="text-xs bg-muted px-2 py-1 rounded">{restaurant.slug}</code>
          </div>
          {restaurant.plan_status === 'trial' && trialDaysLeft !== null && (
            <div className="col-span-full flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              {trialDaysLeft > 0
                ? `Seu trial expira em ${trialDaysLeft} dia(s). Entre em contato para ativar seu plano.`
                : 'Seu período de trial expirou. Entre em contato para continuar.'}
            </div>
          )}
          {restaurant.payment_provider && (
            <div>
              <p className="text-muted-foreground text-xs mb-1">Gateway</p>
              <div className="flex items-center gap-1 text-xs font-medium">
                <CreditCard className="w-3 h-3" />
                <span className="capitalize">{restaurant.payment_provider}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Formulário */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-5">
            <h2 className="font-semibold text-lg">Identidade Visual</h2>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Restaurante *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="color_primary" render={({ field }) => (
              <FormItem>
                <FormLabel>Cor Primária</FormLabel>
                <div className="flex gap-3 items-center">
                  <FormControl>
                    <input
                      type="color"
                      value={field.value}
                      onChange={field.onChange}
                      className="w-12 h-10 p-1 rounded border cursor-pointer"
                    />
                  </FormControl>
                  <FormControl>
                    <Input {...field} className="flex-1 font-mono" placeholder="#c8410a" />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-lg">Modalidades de Atendimento</h2>

            <FormField control={form.control} name="table_enabled" render={({ field }) => (
              <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <FormLabel className="text-base !mt-0">Cardápio de Mesa (QR Code)</FormLabel>
                  <p className="text-xs text-muted-foreground mt-0.5">Clientes escaneiam o QR Code e fazem pedidos pelo celular.</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="delivery_enabled" render={({ field }) => (
              <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                <div>
                  <FormLabel className="text-base !mt-0">Delivery</FormLabel>
                  <p className="text-xs text-muted-foreground mt-0.5">Habilita pedidos com entrega no endereço do cliente.</p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

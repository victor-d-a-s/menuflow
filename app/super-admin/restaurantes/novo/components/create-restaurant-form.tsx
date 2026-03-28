'use client'
export const runtime = 'edge'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createRestaurant, createRestaurantSchema, type CreateRestaurantInput } from '../actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function CreateRestaurantForm() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<CreateRestaurantInput>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: '',
      slug: '',
      plan: 'basico',
      status: 'trial',
      trialDays: 14,
      gateway: 'pagarme',
      fee: 1.5,
      color: '#c8410a',
      deliveryEnabled: false,
      tableMenuEnabled: true,
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    },
  })

  const watchStatus = form.watch('status')

  const onSubmit = (values: CreateRestaurantInput) => {
    setServerError(null)
    startTransition(async () => {
      const result = await createRestaurant(values)
      if (result?.error) {
        setServerError(result.error)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na criação</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna 1: Dados do Restaurante */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-semibold">Dados do Estabelecimento</h2>
            </div>

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Restaurante *</FormLabel>
                <FormControl><Input placeholder="Ex: Pizzaria Bella" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="slug" render={({ field }) => (
              <FormItem>
                <FormLabel>Slug (URL) *</FormLabel>
                <FormControl><Input placeholder="pizzaria-bella" {...field} /></FormControl>
                <FormDescription>menuflow.com.br/<b>{field.value || 'slug'}</b></FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="plan" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano Inicial</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {watchStatus === 'trial' && (
              <FormField control={form.control} name="trialDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias de Trial</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="gateway" render={({ field }) => (
                <FormItem>
                  <FormLabel>Gateway</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pagarme">Pagar.me</SelectItem>
                      <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="fee" render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa Plataforma (%)</FormLabel>
                  <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="color" render={({ field }) => (
              <FormItem>
                <FormLabel>Cor Primária (Hex)</FormLabel>
                <div className="flex gap-3">
                  <FormControl><Input type="color" className="w-16 p-1 h-10" {...field} /></FormControl>
                  <FormControl><Input className="flex-1" {...field} /></FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex flex-col gap-4 p-4 border rounded-md bg-muted/30">
              <FormField control={form.control} name="deliveryEnabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg">
                  <FormLabel className="text-base">Delivery Habilitado</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="tableMenuEnabled" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg">
                  <FormLabel className="text-base">Cardápio de Mesa</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </div>
          </div>

          {/* Coluna 2: Dados do Admin */}
          <div className="space-y-6">
            <div className="border-b pb-2">
              <h2 className="text-xl font-semibold">Conta do Administrador</h2>
              <p className="text-sm text-muted-foreground mt-1">Este usuário terá acesso total ao painel do restaurante.</p>
            </div>

            <FormField control={form.control} name="adminName" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo *</FormLabel>
                <FormControl><Input placeholder="João da Silva" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="adminEmail" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail (Login) *</FormLabel>
                <FormControl><Input type="email" placeholder="joao@pizzariabella.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="adminPassword" render={({ field }) => (
              <FormItem>
                <FormLabel>Senha Temporária *</FormLabel>
                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                <FormDescription>O admin poderá alterar a senha depois.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t pt-6">
          <Button type="button" variant="outline" asChild disabled={isPending}>
            <Link href="/super-admin/restaurantes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Restaurante
          </Button>
        </div>
      </form>
    </Form>
  )
}

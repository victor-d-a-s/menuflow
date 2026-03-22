'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, Plus, MoreHorizontal, KeyRound, Trash2, Edit2, Loader2 } from 'lucide-react'

import { createUser, deleteUser, resetUserPassword, createUserSchema, type CreateUserInput } from '../actions'

interface Restaurant { id: string; name: string }
interface User { id: string; full_name: string }

// --- DIALOG DE NOVO USUÁRIO ---
export function NewUserDialog({ restaurants }: { restaurants: Restaurant[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { fullName: '', email: '', password: '', role: 'restaurant_admin', restaurantId: 'none' },
  })

  const watchRole = form.watch('role')

  const onSubmit = (data: CreateUserInput) => {
    startTransition(async () => {
      const res = await createUser(data)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Usuário criado com sucesso!')
        setOpen(false)
        form.reset()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Usuário</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
          <DialogDescription>Preencha os dados para criar um novo membro.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem><FormLabel>Nome Completo *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>E-mail *</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>Senha Temporária *</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem><FormLabel>Cargo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="restaurant_admin">Admin do Restaurante</SelectItem>
                    <SelectItem value="kitchen">Cozinha/Operação</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )} />

            {watchRole !== 'super_admin' && (
              <FormField control={form.control} name="restaurantId" render={({ field }) => (
                <FormItem><FormLabel>Vincular ao Restaurante *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o restaurante" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">Selecione...</SelectItem>
                      {restaurants.map(rest => (
                        <SelectItem key={rest.id} value={rest.id}>{rest.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select><FormMessage />
                </FormItem>
              )} />
            )}

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// --- FILTROS ---
export function UserFilters({ restaurants }: { restaurants: Restaurant[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(searchParams.get('busca') || '')
  // ✅ Ref para evitar loop infinito no debounce
  const prevSearchRef = useRef(search)

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'todos') params.set(k, v)
      else params.delete(k)
    })
    if (updates.role || updates.restaurante) params.set('pagina', '1')
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  // ✅ Sem searchParams nas dependências — evita loop infinito
  useEffect(() => {
    if (search === prevSearchRef.current) return
    const timer = setTimeout(() => {
      prevSearchRef.current = search
      updateParams({ busca: search, pagina: '1' })
    }, 500)
    return () => clearTimeout(timer)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>
      <Select value={searchParams.get('role') || 'todos'} onValueChange={(val) => updateParams({ role: val })}>
        <SelectTrigger className="w-[200px]"><SelectValue placeholder="Cargo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Cargos</SelectItem>
          <SelectItem value="super_admin">Super Admin</SelectItem>
          <SelectItem value="restaurant_admin">Admin do Restaurante</SelectItem>
          <SelectItem value="kitchen">Cozinha</SelectItem>
        </SelectContent>
      </Select>
      <Select value={searchParams.get('restaurante') || 'todos'} onValueChange={(val) => updateParams({ restaurante: val })}>
        <SelectTrigger className="w-[220px]"><SelectValue placeholder="Restaurante" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Restaurantes</SelectItem>
          {restaurants.map(rest => (
            <SelectItem key={rest.id} value={rest.id}>{rest.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// --- AÇÕES DA LINHA ---
export function UserRowActions({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUser(user.id)
      if (res?.error) toast.error(res.error)
      else toast.success('Usuário excluído.')
    })
  }

  const handleResetPassword = () => {
    // ✅ Em produção substituir prompt() por Dialog dedicado
    const newPass = prompt(`Nova senha temporária para ${user.full_name} (mínimo 8 caracteres):`)
    if (!newPass) return

    startTransition(async () => {
      const res = await resetUserPassword(user.id, newPass)
      if (res?.error) toast.error(res.error)
      else toast.success('Senha atualizada com sucesso.')
    })
  }

  return (
    <div className="flex justify-end items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/super-admin/usuarios/${user.id}`}><Edit2 className="mr-2 h-4 w-4" />Editar Perfil</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleResetPassword} disabled={isPending}>
            <KeyRound className="mr-2 h-4 w-4" /> Resetar Senha
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o acesso de <b>{user.full_name}</b>? Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">Sim, excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

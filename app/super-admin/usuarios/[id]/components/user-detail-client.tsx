'use client'
export const runtime = 'edge'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { updateUserProfile, resetPassword, toggleBan, deleteUser, updateUserSchema, type UpdateUserInput } from '../actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Loader2, ShieldAlert, KeyRound, Trash2 } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  role: string
  restaurant_id?: string
  restaurants?: { id: string; name: string }
}
interface AuthUser {
  email: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  banned_until?: string
}
interface Restaurant { id: string; name: string }

type Props = {
  profile: Profile
  authUser: AuthUser
  restaurants: Restaurant[]
  isBanned: boolean
}

export function UserDetailClient({ profile, authUser, restaurants, isBanned: initialBanned }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newPassword, setNewPassword] = useState('')
  // ✅ isBanned reativo — atualiza UI imediatamente após a ação
  const [banned, setBanned] = useState(initialBanned)
  // ✅ useRef para resetar formulário de senha sem acessar o DOM diretamente
  const resetFormRef = useRef<HTMLFormElement>(null)

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullName: profile.full_name || '',
      role: profile.role as any,
      restaurantId: profile.restaurant_id || 'none',
    },
  })

  const watchRole = form.watch('role')

  const onUpdateProfile = (data: UpdateUserInput) => {
    startTransition(async () => {
      const res = await updateUserProfile(profile.id, data)
      if (res?.error) toast.error(res.error)
      else toast.success('Perfil atualizado com sucesso!')
    })
  }

  const handleResetPassword = () => {
    if (newPassword.length < 8) {
      toast.error('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    startTransition(async () => {
      const res = await resetPassword(profile.id, newPassword)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Senha atualizada com sucesso!')
        setNewPassword('')
        // ✅ Resetar via ref em vez de document.getElementById
        resetFormRef.current?.reset()
      }
    })
  }

  const handleToggleBan = () => {
    startTransition(async () => {
      const res = await toggleBan(profile.id, banned)
      if (res?.error) toast.error(res.error)
      else {
        // ✅ Atualiza estado local imediatamente
        setBanned(!banned)
        toast.success(banned ? 'Usuário desbloqueado.' : 'Usuário bloqueado.')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteUser(profile.id)
      if (res?.error) toast.error(res.error)
      // ✅ router.push() no client em vez de redirect() na server action
      else router.push('/super-admin/usuarios')
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Coluna Esquerda: Edição de Perfil */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Editar Perfil</CardTitle>
            <CardDescription>Atualize os dados básicos e o nível de acesso do usuário.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onUpdateProfile)} className="space-y-6">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel>Cargo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent position="popper">
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="restaurant_admin">Admin do Restaurante</SelectItem>
                          <SelectItem value="kitchen">Cozinha/Operação</SelectItem>
                        </SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />

                  {watchRole !== 'super_admin' && (
                    <FormField control={form.control} name="restaurantId" render={({ field }) => (
                      <FormItem><FormLabel>Restaurante Vinculado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'none'}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                          <SelectContent position="popper">
                            <SelectItem value="none">Nenhum</SelectItem>
                            {restaurants.map(rest => (
                              <SelectItem key={rest.id} value={rest.id}>{rest.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita: Ações Sensíveis */}
      <div className="space-y-6">

        {/* Reset de Senha */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-muted-foreground" /> Resetar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ✅ ref em vez de id para resetar o form */}
            <form ref={resetFormRef} className="space-y-3">
              <Input
                type="password"
                placeholder="Nova senha temporária"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isPending}
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleResetPassword}
                disabled={isPending || newPassword.length < 8}
                type="button"
              >
                Atualizar Senha
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bloqueio de Acesso */}
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-500">
              <ShieldAlert className="w-5 h-5" /> Controle de Acesso
            </CardTitle>
            <CardDescription className="text-orange-600/80">
              Impedir este usuário de fazer login na plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* ✅ Usa banned (state local) em vez de isBanned (prop estática) */}
            <Button
              variant={banned ? 'default' : 'outline'}
              className={`w-full ${!banned ? 'border-orange-300 text-orange-700 hover:bg-orange-100' : ''}`}
              onClick={handleToggleBan}
              disabled={isPending}
            >
              {banned ? 'Desbloquear Usuário' : 'Bloquear Acesso'}
            </Button>
          </CardContent>
        </Card>

        {/* Zona de Perigo */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> Zona de Perigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isPending}>
                  Excluir Usuário Permanentemente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O usuário <b>{profile.full_name}</b> perderá acesso imediato e todos os seus dados de autenticação serão apagados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                    Sim, excluir conta
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

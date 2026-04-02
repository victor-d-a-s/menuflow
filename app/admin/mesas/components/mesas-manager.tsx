'use client'
export const runtime = 'edge'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { createTable, toggleTable, deleteTable } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Trash2, QrCode, ExternalLink, Loader2 } from 'lucide-react'

type Table = { id: string; name_or_number: string; qr_code?: string; active: boolean }

export function MesasManager({ tables: initialTables, restaurantId, slug }: {
  tables: Table[]
  restaurantId: string
  slug: string
}) {
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [qrVisible, setQrVisible] = useState<string | null>(null)

  const menuUrl = (qrCode: string) =>
    `${process.env.NEXT_PUBLIC_BASE_URL || 'https://menuflow.com.br'}/cardapio/${slug}?mesa=${qrCode}`

  const handleCreate = () => {
    if (!newName.trim()) return
    startTransition(async () => {
      const res = await createTable(newName)
      if (res.error) toast.error(res.error)
      else { toast.success('Mesa criada!'); setNewName('') }
    })
  }

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleTable(id, !current)
      if (res.error) toast.error(res.error)
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteTable(id)
      if (res.error) toast.error(res.error)
      else toast.success('Mesa excluída!')
    })
  }

  const handleCopyUrl = (qrCode: string) => {
    navigator.clipboard.writeText(menuUrl(qrCode))
    toast.success('Link copiado!')
  }

  const activeTables = initialTables.filter(t => t.active).length

  return (
    <div className="space-y-6">
      {/* Adicionar mesa */}
      <div className="flex gap-2 items-center bg-card border rounded-xl p-4">
        <Input
          placeholder="Nome ou número da mesa (ex: Mesa 1, Varanda...)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="flex-1"
          disabled={isPending}
        />
        <Button onClick={handleCreate} disabled={!newName.trim() || isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Adicionar
        </Button>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>{initialTables.length} mesas cadastradas</span>
        <span>·</span>
        <span className="text-emerald-600 font-medium">{activeTables} ativas</span>
      </div>

      {initialTables.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-card">
          <QrCode className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma mesa cadastrada.</p>
          <p className="text-sm mt-1">Adicione mesas para gerar QR codes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialTables.map(table => (
            <div key={table.id}
              className={`bg-card border rounded-xl p-5 space-y-4 transition-opacity ${!table.active ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{table.name_or_number}</p>
                  <Badge variant={table.active ? 'default' : 'secondary'}
                    className={`text-xs mt-1 ${table.active ? 'bg-emerald-500' : ''}`}>
                    {table.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={table.active}
                    onCheckedChange={() => handleToggle(table.id, table.active)}
                    disabled={isPending}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="hover:text-red-600 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir {table.name_or_number}?</AlertDialogTitle>
                        <AlertDialogDescription>O QR Code desta mesa deixará de funcionar.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(table.id)} className="bg-red-600">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {table.qr_code && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs"
                      onClick={() => setQrVisible(qrVisible === table.id ? null : table.id)}>
                      <QrCode className="w-3 h-3 mr-1" />
                      {qrVisible === table.id ? 'Ocultar QR' : 'Ver QR Code'}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs"
                      onClick={() => handleCopyUrl(table.qr_code!)}>
                      Copiar Link
                    </Button>
                  </div>

                  {qrVisible === table.id && (
                    <div className="bg-white p-3 rounded-lg border text-center space-y-2">
                      {/* QR Code gerado via API gratuita */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(menuUrl(table.qr_code))}`}
                        alt={`QR Code ${table.name_or_number}`}
                        className="mx-auto w-44 h-44"
                      />
                      <p className="text-xs text-muted-foreground break-all">{menuUrl(table.qr_code)}</p>
                      <a
                        href={menuUrl(table.qr_code)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#c8410a] hover:underline"
                      >
                        Testar link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

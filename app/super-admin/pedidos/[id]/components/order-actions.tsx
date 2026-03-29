'use client'
export const runtime = 'edge'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { cancelOrder, updateOrderStatus } from '../actions'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Ban, Save, Loader2 } from 'lucide-react'

type Props = {
  orderId: string
  currentStatus: string
}

export function OrderSupportActions({ orderId, currentStatus: initialStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  // ✅ currentStatus reativo — atualiza UI imediatamente após ação
  const [currentStatus, setCurrentStatus] = useState(initialStatus)
  const [selectedStatus, setSelectedStatus] = useState(initialStatus)

  const handleUpdateStatus = () => {
    if (selectedStatus === currentStatus) return
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, selectedStatus)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Status atualizado com sucesso!')
        setCurrentStatus(selectedStatus)
      }
    })
  }

  const handleCancelOrder = () => {
    startTransition(async () => {
      const res = await cancelOrder(orderId)
      if (res?.error) toast.error(res.error)
      else {
        toast.success('Pedido cancelado.')
        setCurrentStatus('cancelado')
        setSelectedStatus('cancelado')
      }
    })
  }

  const isCancelled = currentStatus === 'cancelado'

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/50 p-4 rounded-lg border">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Forçar Status:</span>
        <Select value={selectedStatus} onValueChange={setSelectedStatus} disabled={isPending || isCancelled}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="preparando">Preparando</SelectItem>
            <SelectItem value="pronto">Pronto</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="secondary"
          onClick={handleUpdateStatus}
          disabled={isPending || selectedStatus === currentStatus || isCancelled}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex-1" />

      {!isCancelled && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending} className="w-full sm:w-auto">
              <Ban className="w-4 h-4 mr-2" />
              Cancelar Pedido
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar este pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza de que deseja cancelar o pedido <b>#{orderId.slice(0, 8)}</b>? Esta ação interromperá o fluxo do pedido no restaurante.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Voltar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelOrder} className="bg-red-600 hover:bg-red-700">
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

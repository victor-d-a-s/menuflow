'use client'
export const runtime = 'edge'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { reactivateSubscription } from '../actions'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, PlayCircle } from 'lucide-react'

// --- FILTROS DE PERÍODO ---
export function FinancialFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [preset, setPreset] = useState(searchParams.get('periodo') || 'este_mes')
  const [customFrom, setCustomFrom] = useState(searchParams.get('de') || '')
  const [customTo, setCustomTo] = useState(searchParams.get('ate') || '')

  // ✅ Função direta em vez de useEffect — evita loop infinito
  const applyFilter = (newPreset: string, from?: string, to?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', newPreset)

    if (newPreset === 'custom') {
      if (from) params.set('de', from); else params.delete('de')
      if (to) params.set('ate', to); else params.delete('ate')
    } else {
      params.delete('de')
      params.delete('ate')
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const handlePresetChange = (val: string) => {
    setPreset(val)
    applyFilter(val, customFrom, customTo)
  }

  const handleCustomFromChange = (val: string) => {
    setCustomFrom(val)
    if (preset === 'custom') applyFilter('custom', val, customTo)
  }

  const handleCustomToChange = (val: string) => {
    setCustomTo(val)
    if (preset === 'custom') applyFilter('custom', customFrom, val)
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-lg border">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Período:</span>
        <Select value={preset} onValueChange={handlePresetChange}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="este_mes">Este Mês</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {preset === 'custom' && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input type="date" value={customFrom} onChange={e => handleCustomFromChange(e.target.value)} className="w-[140px]" />
          <span className="text-sm text-muted-foreground">até</span>
          <Input type="date" value={customTo} onChange={e => handleCustomToChange(e.target.value)} className="w-[140px]" />
        </div>
      )}

      {isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
    </div>
  )
}

// --- BOTÃO REATIVAR ---
export function ReactivateButton({ restaurantId, restaurantName }: { restaurantId: string; restaurantName: string }) {
  const [isPending, startTransition] = useTransition()

  const handleReactivate = () => {
    startTransition(async () => {
      const res = await reactivateSubscription(restaurantId)
      if (res?.error) toast.error(res.error)
      else toast.success(`Assinatura de ${restaurantName} reativada!`)
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReactivate} disabled={isPending} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
      {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
      Reativar Manualmente
    </Button>
  )
}

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterX } from 'lucide-react'

type Restaurant = { id: string; name: string }

export function OrderFilters({ restaurants }: { restaurants: Restaurant[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'todos') params.set(key, value)
      else params.delete(key)
    })

    params.set('pagina', '1')

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    startTransition(() => router.replace(pathname))
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some(k => k !== 'pagina')

  return (
    <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6 p-4 bg-card border rounded-lg">
      <Select
        value={searchParams.get('restaurante') || 'todos'}
        onValueChange={(val) => updateParams({ restaurante: val })}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Restaurante" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Restaurantes</SelectItem>
          {restaurants.map(r => (
            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') || 'todos'}
        onValueChange={(val) => updateParams({ status: val })}
      >
        <SelectTrigger className="w-full md:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Status</SelectItem>
          <SelectItem value="pendente">Pendente</SelectItem>
          <SelectItem value="pago">Pago</SelectItem>
          <SelectItem value="preparando">Preparando</SelectItem>
          <SelectItem value="pronto">Pronto</SelectItem>
          <SelectItem value="entregue">Entregue</SelectItem>
          <SelectItem value="cancelado">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('tipo') || 'todos'}
        onValueChange={(val) => updateParams({ tipo: val })}
      >
        <SelectTrigger className="w-full md:w-[150px]">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Tipos</SelectItem>
          <SelectItem value="delivery">Delivery</SelectItem>
          <SelectItem value="mesa">Mesa</SelectItem>
          <SelectItem value="retirada">Retirada</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">De:</span>
        <Input
          type="date"
          value={searchParams.get('data_inicio') || ''}
          onChange={(e) => updateParams({ data_inicio: e.target.value })}
          className="w-[140px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Até:</span>
        <Input
          type="date"
          value={searchParams.get('data_fim') || ''}
          onChange={(e) => updateParams({ data_fim: e.target.value })}
          className="w-[140px]"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} disabled={isPending} className="text-muted-foreground hover:text-foreground">
          <FilterX className="w-4 h-4 mr-2" />
          Limpar Filtros
        </Button>
      )}
    </div>
  )
}

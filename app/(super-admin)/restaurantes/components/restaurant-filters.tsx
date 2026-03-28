'use client'
export const runtime = 'edge'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search } from 'lucide-react'

export function RestaurantFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('busca') || '')
  // ✅ Ref para evitar loop infinito no useEffect de debounce
  const prevSearchRef = useRef(search)

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'todos') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    if (updates.plano || updates.status) {
      params.set('pagina', '1')
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  // ✅ Debounce sem searchParams nas dependências — evita loop infinito
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
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={searchParams.get('plano') || 'todos'}
        onValueChange={(val) => updateParams({ plano: val })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Plano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Planos</SelectItem>
          <SelectItem value="basico">Básico</SelectItem>
          <SelectItem value="pro">Pro</SelectItem>
          <SelectItem value="ultra">Ultra</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') || 'todos'}
        onValueChange={(val) => updateParams({ status: val })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os Status</SelectItem>
          <SelectItem value="trial">Trial</SelectItem>
          <SelectItem value="active">Ativo</SelectItem>
          <SelectItem value="suspended">Suspenso</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

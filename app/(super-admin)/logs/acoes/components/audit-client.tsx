'use client'
export const runtime = 'edge'

import { useState, useTransition, Fragment } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, ExternalLink, Loader2 } from 'lucide-react'

interface Admin { id: string; full_name: string }

interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  details?: any
  ip_address?: string
  created_at: string
  profiles?: { full_name: string }
}

type Props = {
  logs: AuditLog[]
  admins: Admin[]
  distinctActions: string[]
}

export function AuditLogsClient({ logs, admins, distinctActions }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [admin, setAdmin] = useState(searchParams.get('admin') || 'todos')
  const [actionFilter, setActionFilter] = useState(searchParams.get('acao') || 'todos')
  const [entity, setEntity] = useState(searchParams.get('entidade') || 'todos')
  const [periodo, setPeriodo] = useState(searchParams.get('periodo') || 'hoje')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // ✅ Função direta em vez de useEffect — evita loop infinito
  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'todos') params.set(key, value)
    else params.delete(key)
    startTransition(() => router.replace(`${pathname}?${params.toString()}`))
  }

  const handleAdminChange = (val: string) => { setAdmin(val); applyFilter('admin', val) }
  const handleActionChange = (val: string) => { setActionFilter(val); applyFilter('acao', val) }
  const handleEntityChange = (val: string) => { setEntity(val); applyFilter('entidade', val) }
  const handlePeriodoChange = (val: string) => { setPeriodo(val); applyFilter('periodo', val) }

  const toggleRow = (id: string) => setExpandedRow(expandedRow === id ? null : id)

  const getActionBadge = (actionStr: string) => {
    const act = actionStr.toLowerCase()
    if (act.includes('delete') || act.includes('remove') || act.includes('suspend') || act.includes('cancel')) {
      return <Badge variant="destructive" className="shadow-none">{actionStr}</Badge>
    }
    if (act.includes('create') || act.includes('add') || act.includes('reactivate')) {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 shadow-none">{actionStr}</Badge>
    }
    if (act.includes('update') || act.includes('edit')) {
      return <Badge className="bg-blue-500 hover:bg-blue-600 shadow-none">{actionStr}</Badge>
    }
    return <Badge variant="secondary" className="shadow-none">{actionStr}</Badge>
  }

  const getEntityLink = (type: string, id: string) => {
    switch (type) {
      case 'restaurant': return `/super-admin/restaurantes/${id}`
      case 'user': return `/super-admin/usuarios/${id}`
      case 'order': return `/super-admin/pedidos/${id}`
      case 'plan': return `/super-admin/planos`
      default: return null
    }
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-card p-4 rounded-lg border">
        <Select value={admin} onValueChange={handleAdminChange}>
          <SelectTrigger><SelectValue placeholder="Administrador" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Administradores</SelectItem>
            {admins.map(a => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={handleActionChange}>
          <SelectTrigger><SelectValue placeholder="Tipo de Ação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Ações</SelectItem>
            {distinctActions.map(act => <SelectItem key={act} value={act}>{act}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={entity} onValueChange={handleEntityChange}>
          <SelectTrigger><SelectValue placeholder="Entidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Entidades</SelectItem>
            <SelectItem value="restaurant">Restaurante</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="order">Pedido</SelectItem>
            <SelectItem value="plan">Plano / Override</SelectItem>
            <SelectItem value="setting">Configuração</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Select value={periodo} onValueChange={handlePeriodoChange}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          {isPending && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Data / Hora</TableHead>
              <TableHead>Administrador</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>ID da Entidade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum log de auditoria encontrado.</TableCell></TableRow>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedRow === log.id
                const entityLink = getEntityLink(log.entity_type, log.entity_id)

                return (
                  <Fragment key={log.id}>
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}
                      onClick={() => toggleRow(log.id)}
                    >
                      <TableCell className="text-muted-foreground">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.profiles?.full_name || 'Sistema / Deletado'}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="uppercase text-xs font-semibold text-muted-foreground">{log.entity_type}</TableCell>
                      <TableCell>
                        {entityLink ? (
                          <Button variant="link" className="h-auto p-0 font-mono text-xs text-blue-600" onClick={(e) => e.stopPropagation()} asChild>
                            <Link href={entityLink}>{log.entity_id.slice(0, 13)}... <ExternalLink className="w-3 h-3 ml-1 inline" /></Link>
                          </Button>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">{log.entity_id.slice(0, 13)}...</span>
                        )}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={6} className="p-0 border-b">
                          <div className="p-4 pl-12 flex flex-col md:flex-row gap-6">
                            {log.details ? (
                              <div className="flex-1 space-y-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">Detalhes (JSON)</span>
                                <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto">
                                  <pre className="text-xs text-zinc-300 font-mono leading-relaxed">
                                    <code>{JSON.stringify(log.details, null, 2)}</code>
                                  </pre>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 text-sm text-muted-foreground italic">Nenhum detalhe adicional registrado.</div>
                            )}

                            <div className="w-full md:w-64 space-y-2 border-l pl-6">
                              <span className="text-xs font-semibold text-muted-foreground uppercase">Metadados</span>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">IP Origem:</span> <span className="font-mono">{log.ip_address || 'N/A'}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Log ID:</span> <span className="font-mono text-xs" title={log.id}>{log.id.slice(0, 8)}</span></div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

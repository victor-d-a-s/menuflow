'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/super-admin/actions'

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, Store, Users, Receipt, DollarSign,
  Layers, Terminal, Settings, LogOut, Menu, ChevronDown, ChevronRight
} from 'lucide-react'

type SidebarProps = {
  adminName: string
}

const navItems = [
  { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { name: 'Restaurantes', href: '/super-admin/restaurantes', icon: Store },
  { name: 'Usuários', href: '/super-admin/usuarios', icon: Users },
  { name: 'Pedidos', href: '/super-admin/pedidos', icon: Receipt },
  {
    name: 'Financeiro',
    icon: DollarSign,
    subItems: [
      { name: 'Visão Geral', href: '/super-admin/financeiro' },
      { name: 'Reembolsos', href: '/super-admin/financeiro/reembolsos' },
    ],
  },
  { name: 'Planos', href: '/super-admin/planos', icon: Layers },
  {
    name: 'Logs',
    icon: Terminal,
    subItems: [
      { name: 'Webhooks', href: '/super-admin/logs/webhooks' },
      { name: 'Auditoria', href: '/super-admin/logs/acoes' },
    ],
  },
  { name: 'Configurações', href: '/super-admin/configuracoes', icon: Settings },
]

export function Sidebar({ adminName }: SidebarProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // ✅ Sub-itens colapsáveis — expandidos apenas quando o pathname bate com algum sub-item
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    navItems
      .filter(item => item.subItems?.some(sub => pathname.startsWith(sub.href)))
      .map(item => item.name)
  )

  const toggleGroup = (name: string) => {
    setOpenGroups(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#1a1612] text-zinc-300">
      {/* Header / Logo */}
      <div className="p-6 border-b border-zinc-800/50">
        <h1 className="text-2xl font-bold text-white tracking-tight">MenuFlow</h1>
        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-100 bg-red-600 rounded-sm">
          Super Admin
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href
            ? pathname === item.href
            : item.subItems?.some(sub => pathname.startsWith(sub.href))
          const isGroupOpen = openGroups.includes(item.name)

          return (
            <div key={item.name} className="space-y-1">
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium
                    ${isActive ? 'bg-[#c8410a]/10 text-[#c8410a]' : 'hover:bg-[#c8410a]/20 hover:text-white'}`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-[#c8410a]' : 'text-zinc-500'}`} />
                  {item.name}
                </Link>
              ) : (
                <div>
                  {/* ✅ Botão de grupo colapsável */}
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium
                      ${isActive ? 'text-[#c8410a]' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-[#c8410a]' : 'text-zinc-500'}`} />
                    {item.name}
                    {isGroupOpen
                      ? <ChevronDown className="w-4 h-4 ml-auto opacity-50" />
                      : <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
                    }
                  </button>

                  {/* Sub-itens — só renderiza se o grupo estiver aberto */}
                  {isGroupOpen && (
                    <div className="ml-9 space-y-1 mt-1 border-l border-zinc-800 pl-2">
                      {item.subItems?.map(sub => {
                        const isSubActive = pathname === sub.href
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={`block px-3 py-2 rounded-md transition-colors text-sm
                              ${isSubActive
                                ? 'text-[#c8410a] font-medium'
                                : 'text-zinc-400 hover:text-[#c8410a] hover:bg-[#c8410a]/10'}`}
                          >
                            {sub.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white border border-zinc-700">
            {getInitials(adminName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{adminName}</p>
            <p className="text-xs text-zinc-500 truncate">Administrador</p>
          </div>
        </div>

        <form action={signOut}>
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
            type="submit"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair do sistema
          </Button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#1a1612] border-b border-zinc-800 flex items-center px-4 z-50">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[260px] border-zinc-800">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <span className="ml-4 text-lg font-bold text-white">MenuFlow</span>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>
    </>
  )
}

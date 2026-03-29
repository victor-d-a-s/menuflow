'use client'
export const runtime = 'edge'

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

type Props = { adminName: string }

const navItems = [
  { name: 'Dashboard', href: '/super-admin/dashboard', icon: LayoutDashboard },
  { name: 'Restaurantes', href: '/super-admin/restaurantes', icon: Store },
  { name: 'Usuários', href: '/super-admin/usuarios', icon: Users },
  { name: 'Pedidos', href: '/super-admin/pedidos', icon: Receipt },
  { name: 'Financeiro', icon: DollarSign, subItems: [
    { name: 'Visão Geral', href: '/super-admin/financeiro' },
    { name: 'Reembolsos', href: '/super-admin/financeiro/reembolsos' },
  ]},
  { name: 'Planos', href: '/super-admin/planos', icon: Layers },
  { name: 'Logs', icon: Terminal, subItems: [
    { name: 'Webhooks', href: '/super-admin/logs/webhooks' },
    { name: 'Auditoria', href: '/super-admin/logs/acoes' },
  ]},
  { name: 'Configurações', href: '/super-admin/configuracoes', icon: Settings },
]

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    navItems.filter(i => i.subItems?.some(s => pathname.startsWith(s.href))).map(i => i.name)
  )
  const toggle = (name: string) =>
    setOpenGroups(p => p.includes(name) ? p.filter(n => n !== name) : [...p, name])
  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-300">
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#c8410a] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="text-lg font-bold text-white">MenuFlow</span>
        </div>
        <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-100 bg-red-700 rounded">
          Super Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(item => {
          const isActive = item.href ? pathname === item.href : item.subItems?.some(s => pathname.startsWith(s.href))
          const isOpen = openGroups.includes(item.name)

          return (
            <div key={item.name}>
              {item.href ? (
                <Link href={item.href} onClick={onNav}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'bg-[#c8410a]/20 text-[#e8622a]' : 'hover:bg-zinc-800 hover:text-white'}`}>
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-[#e8622a]' : 'text-zinc-500'}`} />
                  {item.name}
                </Link>
              ) : (
                <div>
                  <button onClick={() => toggle(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                      ${isActive ? 'text-[#e8622a]' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-[#e8622a]' : 'text-zinc-500'}`} />
                    {item.name}
                    {isOpen ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
                  </button>
                  {isOpen && (
                    <div className="ml-9 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-2">
                      {item.subItems?.map(sub => (
                        <Link key={sub.name} href={sub.href} onClick={onNav}
                          className={`block px-3 py-2 rounded-lg text-sm transition-colors
                            ${pathname === sub.href ? 'text-[#e8622a] font-medium' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
            {initials(onNav ? 'Admin' : 'A')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Administrador</p>
            <p className="text-xs text-zinc-500">Super Admin</p>
          </div>
        </div>
        <form action={signOut}>
          <Button variant="ghost" type="submit"
            className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-400/10 text-sm">
            <LogOut className="w-4 h-4 mr-2" />Sair do sistema
          </Button>
        </form>
      </div>
    </div>
  )
}

export function Sidebar({ adminName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 z-50 gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-zinc-800 bg-zinc-900">
            <SidebarContent onNav={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#c8410a] rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-white">MenuFlow</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-50">
        <SidebarContent />
      </aside>
    </>
  )
}

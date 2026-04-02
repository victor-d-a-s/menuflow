'use client'
export const runtime = 'edge'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutRestaurant } from '@/app/admin/actions'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, UtensilsCrossed, Receipt, Table2,
  Settings, LogOut, Menu, ChevronDown, ChevronRight
} from 'lucide-react'

type Props = {
  restaurantName: string
  adminName: string
  plan: string
}

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Pedidos', href: '/admin/pedidos', icon: Receipt },
  { name: 'Cardápio', href: '/admin/cardapio', icon: UtensilsCrossed },
  { name: 'Mesas & QR Code', href: '/admin/mesas', icon: Table2 },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

const planLabel: Record<string, string> = {
  basico: 'Básico',
  pro: 'Pro',
  ultra: 'Ultra',
}

function SidebarContent({ restaurantName, adminName, plan, onNav }: Props & { onNav?: () => void }) {
  const pathname = usePathname()
  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-zinc-300">
      <div className="p-5 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-[#c8410a] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="text-lg font-bold text-white truncate">{restaurantName}</span>
        </div>
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-100 bg-orange-700 rounded">
          Plano {planLabel[plan] || plan}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-[#c8410a]/20 text-[#e8622a]' : 'hover:bg-zinc-800 hover:text-white'}`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? 'text-[#e8622a]' : 'text-zinc-500'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
            {initials(adminName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{adminName}</p>
            <p className="text-xs text-zinc-500">Admin do Restaurante</p>
          </div>
        </div>
        <form action={signOutRestaurant}>
          <Button variant="ghost" type="submit"
            className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-400/10 text-sm">
            <LogOut className="w-4 h-4 mr-2" />Sair do sistema
          </Button>
        </form>
      </div>
    </div>
  )
}

export function AdminSidebar({ restaurantName, adminName, plan }: Props) {
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
            <SidebarContent
              restaurantName={restaurantName}
              adminName={adminName}
              plan={plan}
              onNav={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#c8410a] rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-white truncate">{restaurantName}</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-50">
        <SidebarContent restaurantName={restaurantName} adminName={adminName} plan={plan} />
      </aside>
    </>
  )
}

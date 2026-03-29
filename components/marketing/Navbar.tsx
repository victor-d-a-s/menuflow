'use client'
export const runtime = 'edge'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function Navbar() {
  const NavLinks = () => (
    <>
      <Link href="/marketing#funcionalidades" className="text-sm font-medium text-slate-600 hover:text-[#c8410a] transition-colors">Funcionalidades</Link>
      <Link href="/marketing/precos" className="text-sm font-medium text-slate-600 hover:text-[#c8410a] transition-colors">Preços</Link>
      <Link href="#contato" className="text-sm font-medium text-slate-600 hover:text-[#c8410a] transition-colors">Contato</Link>
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/marketing" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#c8410a] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">MenuFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <NavLinks />
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild className="text-slate-600 hover:text-[#c8410a]">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-[#c8410a] hover:bg-[#a63508] text-white">
            <Link href="/marketing/cadastro">Começar grátis</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col gap-6 pt-12">
            <NavLinks />
            <div className="flex flex-col gap-3 mt-6 border-t pt-6">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild className="w-full bg-[#c8410a] hover:bg-[#a63508] text-white">
                <Link href="/marketing/cadastro">Começar grátis</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}

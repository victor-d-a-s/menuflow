export const runtime = 'edge'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, PlayCircle, Smartphone, Store } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-white pt-24 pb-32">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#c8410a] text-sm font-medium mb-4">
            <span className="flex h-2 w-2 rounded-full bg-[#c8410a]"></span>
            O sistema definitivo para o seu restaurante
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight">
            Digitalize seu cardápio e <span className="text-[#c8410a]">multiplique</span> suas vendas
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            MenuFlow é a plataforma completa para gestão de pedidos na mesa, delivery e retirada. Simples para você, incrível para o seu cliente.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild className="w-full sm:w-auto bg-[#c8410a] hover:bg-[#a63508] text-white h-14 px-8 text-lg">
              <Link href="/marketing/cadastro">Começar 14 dias grátis <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg text-slate-700 hover:text-[#c8410a]">
              <PlayCircle className="mr-2 w-5 h-5" /> Ver demonstração
            </Button>
          </div>
        </div>

        <div className="mt-20 flex justify-center">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-xl shadow-2xl overflow-hidden border-8 border-slate-800 flex aspect-video items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-8 mb-8">
                <Smartphone className="w-16 h-16 text-[#c8410a]" />
                <Store className="w-16 h-16 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-white">Seu restaurante na palma da mão 🍔🍕🍟</h3>
              <p className="text-slate-400">Interface intuitiva para gestão em tempo real</p>
            </div>
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

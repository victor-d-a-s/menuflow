export const runtime = 'edge'

import Link from 'next/link'
import { Hero } from '@/components/marketing/Hero'
import { Features } from '@/components/marketing/Features'
import { Pricing } from '@/components/marketing/Pricing'
import { Button } from '@/components/ui/button'

export default function MarketingPage() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing />
      
      <section className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-[#c8410a] rounded-full blur-[100px] opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Pronto para transformar seu restaurante?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de restaurantes que já estão aumentando seu faturamento e encantando clientes com o MenuFlow.
          </p>
          <Button size="lg" asChild className="bg-[#c8410a] hover:bg-[#a63508] text-white h-14 px-10 text-lg">
            <Link href="/marketing/cadastro">Criar minha conta grátis</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

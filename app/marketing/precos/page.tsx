export const runtime = 'edge'

import { Pricing } from '@/components/marketing/Pricing'

export default function PrecosPage() {
  return (
    <div className="pt-16 pb-24 bg-slate-50">
      <div className="container mx-auto px-4 text-center max-w-3xl mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Preços transparentes para o seu negócio
        </h1>
        <p className="text-xl text-slate-600">
          Você tem 14 dias grátis para testar qualquer plano. Sem compromisso, sem necessidade de cartão de crédito.
        </p>
      </div>
      <Pricing />
    </div>
  )
}

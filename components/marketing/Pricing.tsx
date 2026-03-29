export const runtime = 'edge'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Básico', price: '89', fee: '1,5%',
    description: 'Ideal para quem está começando a digitalizar.',
    features: ['Cardápio digital via QR Code', 'Gestão de pedidos na mesa', '1 Usuário administrador', 'Suporte por e-mail'],
    highlighted: false,
  },
  {
    name: 'Pro', price: '179', fee: '1,0%',
    description: 'Para restaurantes com alto volume de vendas.',
    features: ['Tudo do plano Básico', 'Módulo de Delivery e Retirada', '3 Usuários administradores', 'Relatórios financeiros avançados', 'Suporte prioritário via WhatsApp'],
    highlighted: true,
  },
  {
    name: 'Ultra', price: '299', fee: '0,5%',
    description: 'A solução definitiva para grandes operações.',
    features: ['Tudo do plano Pro', 'Usuários ilimitados', 'Integração com PDV', 'Gestor de conta dedicado', 'Taxa reduzida no gateway'],
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Planos que cabem no seu bolso</h2>
          <p className="text-lg text-slate-600">Sem taxas escondidas. Cancele quando quiser. Escolha o melhor para o seu momento.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
          {plans.map((plan, index) => (
            <div key={index} className={`rounded-2xl p-8 relative ${plan.highlighted ? 'bg-[#c8410a] text-white shadow-xl scale-100 lg:scale-105 z-10' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}>
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Mais Popular
                </div>
              )}
              <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-orange-100' : 'text-slate-500'}`}>{plan.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">R${plan.price}</span>
                <span className={plan.highlighted ? 'text-orange-200' : 'text-slate-500'}>/mês</span>
              </div>
              <div className={`p-3 rounded-lg mb-8 text-center font-medium text-sm ${plan.highlighted ? 'bg-black/20 text-white' : 'bg-orange-50 text-[#c8410a]'}`}>
                Taxa de transação: {plan.fee}
              </div>
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 ${plan.highlighted ? 'text-orange-200' : 'text-[#c8410a]'}`} />
                    <span className="text-sm">{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={plan.highlighted ? 'secondary' : 'default'}
                className={`w-full h-12 text-base ${!plan.highlighted ? 'bg-[#c8410a] hover:bg-[#a63508] text-white' : 'bg-white text-[#c8410a] hover:bg-slate-100'}`}>
                <Link href="/marketing/cadastro">Escolher {plan.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

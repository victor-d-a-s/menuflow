export const runtime = 'edge'

import { QrCode, Clock, LayoutDashboard, Bike, TrendingUp, MessageCircle } from 'lucide-react'

const features = [
  { title: 'QR Code na mesa', description: 'Seu cliente escaneia, acessa o cardápio e faz o pedido direto do celular, sem precisar chamar o garçom.', icon: QrCode },
  { title: 'Pedidos em tempo real', description: 'Receba os pedidos instantaneamente na cozinha com alertas sonoros e visuais.', icon: Clock },
  { title: 'Painel de gestão', description: 'Controle seu cardápio, preços e disponibilidade de produtos com poucos cliques.', icon: LayoutDashboard },
  { title: 'Múltiplos tipos de entrega', description: 'Gerencie pedidos para consumo no local, retirada no balcão ou delivery.', icon: Bike },
  { title: 'Relatórios financeiros', description: 'Acompanhe seu faturamento, ticket médio e produtos mais vendidos.', icon: TrendingUp },
  { title: 'Suporte via WhatsApp', description: 'Atendimento humanizado e rápido para ajudar você a vender mais todos os dias.', icon: MessageCircle },
]

export function Features() {
  return (
    <section id="funcionalidades" className="py-24 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tudo o que você precisa para crescer</h2>
          <p className="text-lg text-slate-600">Chega de confusão no balcão e pedidos anotados no papel. Automatize sua operação com nossas ferramentas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-[#c8410a]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

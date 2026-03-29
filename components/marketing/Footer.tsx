export const runtime = 'edge'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/marketing" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#c8410a] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MenuFlow</span>
            </Link>
            <p className="text-sm max-w-sm">Revolucionando a forma como pequenos restaurantes vendem e gerenciam seus pedidos no Brasil.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Produto</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/marketing#funcionalidades" className="hover:text-[#c8410a]">Funcionalidades</Link></li>
              <li><Link href="/marketing/precos" className="hover:text-[#c8410a]">Preços</Link></li>
            </ul>
          </div>
          <div>
            <h4 id="contato" className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:contato@menuflow.com.br" className="hover:text-[#c8410a]">contato@menuflow.com.br</a></li>
              <li>WhatsApp: (11) 99999-9999</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row items-center justify-between">
          <p>© 2026 MenuFlow. Todos os direitos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white">Termos de uso</Link>
            <Link href="#" className="hover:text-white">Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

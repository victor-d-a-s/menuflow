'use client'
export const runtime = 'edge'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, ArrowLeft } from 'lucide-react'

export default function CadastroPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4 -ml-4 text-slate-500 hover:text-[#c8410a]">
            <Link href="/marketing"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Link>
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Comece grátis</h1>
          <p className="text-slate-600 mt-2">Crie sua conta e ganhe 14 dias de teste em qualquer plano.</p>
        </div>

        {isSubmitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Solicitação enviada!</h2>
            <p className="text-slate-600">
              Recebemos seus dados com sucesso. Nossa equipe entrará em contato em breve via WhatsApp para liberar seu acesso.
            </p>
            <Button asChild className="mt-6 bg-[#c8410a] hover:bg-[#a63508] w-full">
              <Link href="/marketing">Voltar para a Home</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="restaurant">Nome do Restaurante</Label>
              <Input id="restaurant" required placeholder="Ex: Pizzaria Bella" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Responsável</Label>
              <Input id="name" required placeholder="Seu nome completo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required placeholder="contato@restaurante.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
              <Input id="phone" required placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade / Estado</Label>
              <Input id="city" required placeholder="Ex: São Paulo / SP" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plano Desejado</Label>
              <Select required defaultValue="pro">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="basico">Básico (R$89/mês)</SelectItem>
                  <SelectItem value="pro">Pro (R$179/mês)</SelectItem>
                  <SelectItem value="ultra">Ultra (R$299/mês)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-[#c8410a] hover:bg-[#a63508] text-white h-12 text-lg mt-4">
              Solicitar acesso
            </Button>
            <p className="text-center text-sm text-slate-500 mt-4">
              Já tem uma conta? <Link href="/login" className="text-[#c8410a] font-medium hover:underline">Faça login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

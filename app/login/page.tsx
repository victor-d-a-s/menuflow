'use client'
export const dynamic = 'force-dynamic'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(`Erro: ${error.message}`)
        } else {
          window.location.href = '/'
        }
      } catch (err: any) {
        setError(`Exceção: ${err?.message || JSON.stringify(err)}`)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm p-8 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">MenuFlow</h1>
        <p className="text-zinc-400 text-sm mb-8">Acesse sua conta</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-950 p-2 rounded">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

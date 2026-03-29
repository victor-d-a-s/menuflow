'use client'
export const runtime = 'edge'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updatePlatformSetting, forceSyncAllRoles } from '../actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

interface Plan { id: string; name: string; default_fee_pct: number }
type Props = { settings: Record<string,string>; gatewayUsage: Record<string,number>; envStatus: Record<string,boolean>; plans: Plan[]; baseUrl: string }

export function SettingsTabs({ settings, gatewayUsage, envStatus, plans, baseUrl }: Props) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(settings)
  const [tab, setTab] = useState('gateways')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const save = (k: string) => startTransition(async () => {
    const r = await updatePlatformSetting(k, form[k] || '')
    r.error ? toast.error(r.error) : toast.success('Salvo!')
  })

  const tabs = [
    { id: 'gateways', label: 'Gateways' },
    { id: 'emails', label: 'E-mails' },
    { id: 'dominios', label: 'Domínios' },
    { id: 'sistema', label: 'Sistema' },
  ]

  const gateways = [
    { id: 'pagarme', name: 'Pagar.me', env: envStatus.pagarme, k: 'gateway_pagarme_active' },
    { id: 'mercadopago', name: 'Mercado Pago', env: envStatus.mercadopago, k: 'gateway_mercadopago_active' },
    { id: 'stripe', name: 'Stripe', env: envStatus.stripe, k: 'gateway_stripe_active' },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs no topo */}
      <div className="flex gap-1 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[#c8410a] text-[#c8410a]'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GATEWAYS */}
      {tab === 'gateways' && (
        <div className="space-y-4">
          {gateways.map(gw => (
            <div key={gw.id} className="border rounded-xl p-5 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold">{gw.name}</p>
                    {gw.env
                      ? <Badge className="bg-emerald-500 text-xs mt-1"><CheckCircle2 className="w-3 h-3 mr-1"/>Configurado</Badge>
                      : <Badge variant="destructive" className="text-xs mt-1"><XCircle className="w-3 h-3 mr-1"/>Sem credenciais</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{form[gw.k] === 'true' ? 'Ativo' : 'Inativo'}</span>
                  <Switch checked={form[gw.k] === 'true'}
                    onCheckedChange={v => { set(gw.k, v.toString()); save(gw.k) }}
                    disabled={isPending} />
                </div>
              </div>
              <div className="flex justify-between text-sm py-2 border-t">
                <span className="text-muted-foreground">Restaurantes utilizando:</span>
                <span className="font-bold">{gatewayUsage[gw.id] || 0}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">URL do Webhook</p>
                <code className="block text-xs bg-muted p-3 rounded-lg border break-all leading-relaxed">
                  {baseUrl}/api/webhooks/{gw.id}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* E-MAILS */}
      {tab === 'emails' && (
        <div className="space-y-4">
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <h3 className="font-semibold">Branding</h3>
            {[{k:'nome_plataforma',l:'Nome da Plataforma'},{k:'suporte_whatsapp',l:'WhatsApp de Suporte'}].map(f => (
              <div key={f.k}>
                <label className="text-sm font-medium block mb-1.5">{f.l}</label>
                <div className="flex gap-2">
                  <Input value={form[f.k]||''} onChange={e=>set(f.k,e.target.value)} />
                  <Button variant="secondary" size="icon" onClick={()=>save(f.k)} disabled={isPending}><Save className="w-4 h-4"/></Button>
                </div>
              </div>
            ))}
          </div>

          {[
            {l:'Boas Vindas',p:'email_boas_vindas'},
            {l:'Trial Expirando',p:'email_trial_expirando'},
            {l:'Suspensão de Conta',p:'email_suspensao'},
          ].map(t => (
            <div key={t.p} className="border rounded-xl p-5 bg-card space-y-3">
              <h3 className="font-semibold">{t.l}</h3>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Assunto</label>
                <Input value={form[`${t.p}_assunto`]||''} onChange={e=>set(`${t.p}_assunto`,e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Corpo</label>
                <Textarea rows={3} value={form[`${t.p}_corpo`]||''} onChange={e=>set(`${t.p}_corpo`,e.target.value)} className="resize-none" />
              </div>
              <Button size="sm" className="w-full" onClick={()=>{save(`${t.p}_assunto`);save(`${t.p}_corpo`)}} disabled={isPending}>
                <Save className="w-4 h-4 mr-2"/>Salvar Template
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* DOMÍNIOS */}
      {tab === 'dominios' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Configure qual domínio corresponde a cada módulo. O sistema roteia automaticamente.</p>
          {[
            {k:'domain_marketing',l:'Site de Vendas (Marketing)',e:'menuflow.com.br'},
            {k:'domain_app',l:'Painel Administrativo',e:'app.menuflow.com.br'},
            {k:'domain_cardapio',l:'Cardápio Público',e:'cardapio.menuflow.com.br'},
            {k:'domain_kds',l:'Cozinha (KDS)',e:'cozinha.menuflow.com.br'},
          ].map(d => (
            <div key={d.k} className="border rounded-xl p-5 bg-card">
              <label className="text-sm font-semibold block mb-1">{d.l}</label>
              <p className="text-xs text-muted-foreground mb-3">ex: {d.e}</p>
              <div className="flex gap-2">
                <Input value={form[d.k]||''} onChange={e=>set(d.k,e.target.value)} placeholder={d.e} className="font-mono text-sm" />
                <Button variant="secondary" size="icon" onClick={()=>save(d.k)} disabled={isPending}><Save className="w-4 h-4"/></Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Após alterar, adicione o domínio no Cloudflare Pages. O roteamento atualiza em até 1 minuto.
          </p>
        </div>
      )}

      {/* SISTEMA */}
      {tab === 'sistema' && (
        <div className="space-y-4">
          <div className="border rounded-xl p-5 bg-card space-y-4">
            <h3 className="font-semibold">Regras de Negócio</h3>
            <div>
              <label className="text-sm font-medium block mb-1.5">Dias de Trial Padrão</label>
              <div className="flex gap-2">
                <Input type="number" value={form.default_trial_days||''} onChange={e=>set('default_trial_days',e.target.value)} />
                <Button variant="secondary" onClick={()=>save('default_trial_days')} disabled={isPending}>Salvar</Button>
              </div>
            </div>
            <div className="pt-2 border-t">
              <label className="text-sm font-medium block mb-3">Taxas dos Planos</label>
              {plans.map(p => (
                <div key={p.id} className="flex justify-between bg-muted p-3 rounded-lg text-sm mb-2">
                  <span className="text-muted-foreground font-medium">{p.name}</span>
                  <span className="font-bold">{p.default_fee_pct}%</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-2">Altere as taxas em Planos → Configuração Global.</p>
            </div>
          </div>

          <div className="border border-orange-200 rounded-xl p-5 bg-orange-50/30">
            <h3 className="font-semibold text-orange-700 mb-1">Sincronização JWT</h3>
            <p className="text-xs text-muted-foreground mb-4">Força renovação dos tokens de todos os usuários. Use após mudanças massivas de roles.</p>
            <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100" disabled={isPending}
              onClick={() => startTransition(async () => {
                const r = await forceSyncAllRoles()
                r.error ? toast.error(r.error) : toast.success(`${r.count} usuários sincronizados!`)
              })}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
              Sincronizar Agora
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

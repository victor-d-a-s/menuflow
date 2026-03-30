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
import { Loader2, Save, CreditCard, Mail, Settings, RefreshCw, CheckCircle2, XCircle, Globe } from 'lucide-react'

interface Plan { id: string; name: string; default_fee_pct: number }
type Props = { settings: Record<string,string>; gatewayUsage: Record<string,number>; envStatus: Record<string,boolean>; plans: Plan[]; baseUrl: string }

const tabs = [
  { id: 'gateways', label: 'Gateways', icon: CreditCard },
  { id: 'emails', label: 'E-mails', icon: Mail },
  { id: 'dominios', label: 'Domínios', icon: Globe },
  { id: 'sistema', label: 'Sistema', icon: Settings },
]

export function SettingsTabs({ settings, gatewayUsage, envStatus, plans, baseUrl }: Props) {
  const [active, setActive] = useState('gateways')
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(settings)

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const save = (k: string) => startTransition(async () => {
    const r = await updatePlatformSetting(k, form[k] || '')
    r.error ? toast.error(r.error) : toast.success('Salvo!')
  })

  const gateways = [
    { id: 'pagarme', name: 'Pagar.me', env: envStatus.pagarme, k: 'gateway_pagarme_active' },
    { id: 'mercadopago', name: 'Mercado Pago', env: envStatus.mercadopago, k: 'gateway_mercadopago_active' },
    { id: 'stripe', name: 'Stripe', env: envStatus.stripe, k: 'gateway_stripe_active' },
  ]

  const emailTemplates = [
    { l: 'Boas Vindas', p: 'email_boas_vindas' },
    { l: 'Trial Expirando', p: 'email_trial_expirando' },
    { l: 'Suspensão', p: 'email_suspensao' },
  ]

  const domains = [
    { k: 'domain_marketing', l: 'Site de Vendas', e: 'menuflow.com.br' },
    { k: 'domain_app', l: 'Painel Admin', e: 'app.menuflow.com.br' },
    { k: 'domain_cardapio', l: 'Cardápio Público', e: 'cardapio.menuflow.com.br' },
    { k: 'domain_kds', l: 'Cozinha (KDS)', e: 'cozinha.menuflow.com.br' },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-xl border">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-1 justify-center
              ${active === t.id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* GATEWAYS */}
      {active === 'gateways' && (
        <div className="space-y-4">
          {gateways.map(gw => (
            <div key={gw.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{gw.name}</p>
                  {gw.env
                    ? <Badge className="bg-emerald-500 text-xs mt-1"><CheckCircle2 className="w-3 h-3 mr-1"/>Configurado</Badge>
                    : <Badge variant="destructive" className="text-xs mt-1"><XCircle className="w-3 h-3 mr-1"/>Sem Env Vars</Badge>}
                </div>
                <Switch checked={form[gw.k]==='true'} onCheckedChange={v=>{set(gw.k,v.toString());save(gw.k)}} disabled={isPending}/>
              </div>
              <div className="flex justify-between text-sm mb-3">
                <span className="text-muted-foreground">Restaurantes usando:</span>
                <span className="font-bold">{gatewayUsage[gw.id]||0}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">URL do Webhook</p>
                <code className="block text-xs bg-muted p-2 rounded border break-all">{baseUrl}/api/webhooks/{gw.id}</code>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* E-MAILS */}
      {active === 'emails' && (
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <p className="font-semibold">Branding</p>
            {[{k:'nome_plataforma',l:'Nome da Plataforma'},{k:'suporte_whatsapp',l:'WhatsApp de Suporte'}].map(f=>(
              <div key={f.k} className="space-y-1">
                <label className="text-sm font-medium">{f.l}</label>
                <div className="flex gap-2">
                  <Input value={form[f.k]||''} onChange={e=>set(f.k,e.target.value)}/>
                  <Button variant="secondary" size="icon" onClick={()=>save(f.k)} disabled={isPending}><Save className="w-4 h-4"/></Button>
                </div>
              </div>
            ))}
          </div>
          {emailTemplates.map(t=>(
            <div key={t.p} className="bg-card border rounded-xl p-5 space-y-3">
              <p className="font-semibold">{t.l}</p>
              <Input placeholder="Assunto" value={form[`${t.p}_assunto`]||''} onChange={e=>set(`${t.p}_assunto`,e.target.value)}/>
              <Textarea rows={3} placeholder="Corpo" value={form[`${t.p}_corpo`]||''} onChange={e=>set(`${t.p}_corpo`,e.target.value)} className="resize-none"/>
              <Button size="sm" className="w-full" onClick={()=>{save(`${t.p}_assunto`);save(`${t.p}_corpo`)}} disabled={isPending}>
                <Save className="w-4 h-4 mr-2"/>Salvar
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* DOMÍNIOS */}
      {active === 'dominios' && (
        <div className="space-y-4">
          {domains.map(d=>(
            <div key={d.k} className="bg-card border rounded-xl p-5">
              <p className="font-semibold mb-3">{d.l}</p>
              <div className="flex gap-2">
                <Input value={form[d.k]||''} onChange={e=>set(d.k,e.target.value)} placeholder={d.e} className="font-mono text-sm"/>
                <Button variant="secondary" size="icon" onClick={()=>save(d.k)} disabled={isPending}><Save className="w-4 h-4"/></Button>
              </div>
            </div>
          ))}
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            Após alterar, adicione o domínio no Cloudflare Pages.
          </p>
        </div>
      )}

      {/* SISTEMA */}
      {active === 'sistema' && (
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <p className="font-semibold">Regras de Negócio</p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Dias de Trial Padrão</label>
              <div className="flex gap-2">
                <Input type="number" value={form.default_trial_days||''} onChange={e=>set('default_trial_days',e.target.value)}/>
                <Button variant="secondary" onClick={()=>save('default_trial_days')} disabled={isPending}>Salvar</Button>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Taxas dos Planos</p>
              {plans.map(p=>(
                <div key={p.id} className="flex justify-between bg-muted p-3 rounded-lg text-sm">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-bold">{p.default_fee_pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card border border-orange-200 rounded-xl p-5">
            <p className="font-semibold text-orange-700 mb-1">Sincronização JWT</p>
            <p className="text-xs text-muted-foreground mb-4">Força renovação de tokens de todos os usuários.</p>
            <Button variant="outline" className="w-full border-orange-300 text-orange-700" disabled={isPending}
              onClick={()=>startTransition(async()=>{const r=await forceSyncAllRoles();r.error?toast.error(r.error):toast.success(`${r.count} sincronizados!`)})}>
              {isPending?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:<RefreshCw className="w-4 h-4 mr-2"/>}Sincronizar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

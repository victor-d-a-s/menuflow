'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updatePlatformSetting, forceSyncAllRoles } from '../actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, CreditCard, Mail, Settings, RefreshCw, CheckCircle2, XCircle, Globe } from 'lucide-react'

export const runtime = 'edge'

interface Plan { id: string; name: string; default_fee_pct: number }
type Props = { settings: Record<string,string>; gatewayUsage: Record<string,number>; envStatus: Record<string,boolean>; plans: Plan[]; baseUrl: string }

export function SettingsTabs({ settings, gatewayUsage, envStatus, plans, baseUrl }: Props) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(settings)
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const save = (k: string) => startTransition(async () => {
    const r = await updatePlatformSetting(k, form[k] || '')
    r.error ? toast.error(r.error) : toast.success('Salvo!')
  })

  return (
    <Tabs defaultValue="gateways" className="space-y-6">
      <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1 border">
        <TabsTrigger value="gateways"><CreditCard className="w-4 h-4 mr-1"/>Gateways</TabsTrigger>
        <TabsTrigger value="emails"><Mail className="w-4 h-4 mr-1"/>E-mails</TabsTrigger>
        <TabsTrigger value="dominios"><Globe className="w-4 h-4 mr-1"/>Domínios</TabsTrigger>
        <TabsTrigger value="gerais"><Settings className="w-4 h-4 mr-1"/>Sistema</TabsTrigger>
      </TabsList>

      <TabsContent value="gateways" className="space-y-4">
        {[
          {id:'pagarme',name:'Pagar.me',env:envStatus.pagarme,k:'gateway_pagarme_active'},
          {id:'mercadopago',name:'Mercado Pago',env:envStatus.mercadopago,k:'gateway_mercadopago_active'},
          {id:'stripe',name:'Stripe',env:envStatus.stripe,k:'gateway_stripe_active'},
        ].map(gw => (
          <Card key={gw.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{gw.name}</CardTitle>
                  {gw.env ? <Badge className="bg-emerald-500 text-xs mt-1"><CheckCircle2 className="w-3 h-3 mr-1"/>Configurado</Badge>
                    : <Badge variant="destructive" className="text-xs mt-1"><XCircle className="w-3 h-3 mr-1"/>Sem Env Vars</Badge>}
                </div>
                <Switch checked={form[gw.k]==='true'} onCheckedChange={v=>{set(gw.k,v.toString());save(gw.k)}} disabled={isPending}/>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Restaurantes:</span>
                <span className="font-bold">{gatewayUsage[gw.id]||0}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">URL do Webhook</p>
                <code className="block text-xs bg-muted p-2 rounded border break-all">{baseUrl}/api/webhooks/{gw.id}</code>
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="emails" className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[{k:'nome_plataforma',l:'Nome da Plataforma'},{k:'suporte_whatsapp',l:'WhatsApp de Suporte'}].map(f=>(
              <div key={f.k} className="space-y-1">
                <label className="text-sm font-medium">{f.l}</label>
                <div className="flex gap-2">
                  <Input value={form[f.k]||''} onChange={e=>set(f.k,e.target.value)}/>
                  <Button variant="secondary" size="icon" onClick={()=>save(f.k)} disabled={isPending}><Save className="w-4 h-4"/></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {[{l:'Boas Vindas',p:'email_boas_vindas'},{l:'Trial Expirando',p:'email_trial_expirando'},{l:'Suspensão',p:'email_suspensao'}].map(t=>(
          <Card key={t.p}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{t.l}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Assunto" value={form[`${t.p}_assunto`]||''} onChange={e=>set(`${t.p}_assunto`,e.target.value)}/>
              <Textarea rows={3} placeholder="Corpo" value={form[`${t.p}_corpo`]||''} onChange={e=>set(`${t.p}_corpo`,e.target.value)} className="resize-none"/>
              <Button size="sm" className="w-full" onClick={()=>{save(`${t.p}_assunto`);save(`${t.p}_corpo`)}} disabled={isPending}>
                <Save className="w-4 h-4 mr-2"/>Salvar
              </Button>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="dominios" className="space-y-4">
        {[
          {k:'domain_marketing',l:'Site de Vendas',e:'menuflow.com.br'},
          {k:'domain_app',l:'Painel Admin',e:'app.menuflow.com.br'},
          {k:'domain_cardapio',l:'Cardápio Público',e:'cardapio.menuflow.com.br'},
          {k:'domain_kds',l:'Cozinha (KDS)',e:'cozinha.menuflow.com.br'},
        ].map(d=>(
          <Card key={d.k}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{d.l}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input value={form[d.k]||''} onChange={e=>set(d.k,e.target.value)} placeholder={d.e} className="font-mono text-sm"/>
                <Button variant="secondary" size="icon" onClick={()=>save(d.k)} disabled={isPending}><Save className="w-4 h-4"/></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">Após alterar, adicione o domínio no Cloudflare Pages.</p>
      </TabsContent>

      <TabsContent value="gerais" className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Regras de Negócio</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Dias de Trial Padrão</label>
              <div className="flex gap-2">
                <Input type="number" value={form.default_trial_days||''} onChange={e=>set('default_trial_days',e.target.value)}/>
                <Button variant="secondary" onClick={()=>save('default_trial_days')} disabled={isPending}>Salvar</Button>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <label className="text-sm font-medium">Taxas dos Planos</label>
              {plans.map(p=>(
                <div key={p.id} className="flex justify-between bg-muted p-2 rounded text-sm">
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-bold">{p.default_fee_pct}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader><CardTitle className="text-base text-orange-700">Sincronização JWT</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Força renovação de tokens de todos os usuários.</p>
            <Button variant="outline" className="w-full border-orange-300 text-orange-700" disabled={isPending}
              onClick={()=>startTransition(async()=>{const r=await forceSyncAllRoles();r.error?toast.error(r.error):toast.success(`${r.count} sincronizados!`)})}>
              {isPending?<Loader2 className="w-4 h-4 mr-2 animate-spin"/>:<RefreshCw className="w-4 h-4 mr-2"/>}Sincronizar
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

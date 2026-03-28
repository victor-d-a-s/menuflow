'use client'
export const runtime = 'edge'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updatePlatformSetting, forceSyncAllRoles } from '../actions'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, CreditCard, Mail, Settings, RefreshCw, CheckCircle2, XCircle, Globe } from 'lucide-react'

interface Plan {
  id: string
  name: string
  default_fee_pct: number
}

type SettingsTabsProps = {
  settings: Record<string, string>
  gatewayUsage: Record<string, number>
  envStatus: Record<string, boolean>
  plans: Plan[]
  baseUrl: string
}

export function SettingsTabs({ settings, gatewayUsage, envStatus, plans, baseUrl }: SettingsTabsProps) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState(settings)

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSetting = (key: string) => {
    startTransition(async () => {
      const res = await updatePlatformSetting(key, form[key] || '')
      if (res.error) toast.error(`Erro ao salvar: ${res.error}`)
      else toast.success('Configuração salva com sucesso!')
    })
  }

  const handleSyncRoles = () => {
    startTransition(async () => {
      toast.info('Iniciando sincronização de roles em lote...')
      const res = await forceSyncAllRoles()
      if (res.error) toast.error(res.error)
      else toast.success(`Sincronização concluída! ${res.count} usuários atualizados.`)
    })
  }

  return (
    <Tabs defaultValue="gateways" className="space-y-6">
      <TabsList className="bg-muted/50 p-1 border flex-wrap h-auto gap-1">
        <TabsTrigger value="gateways" className="data-[state=active]:bg-background">
          <CreditCard className="w-4 h-4 mr-2" /> Gateways
        </TabsTrigger>
        <TabsTrigger value="emails" className="data-[state=active]:bg-background">
          <Mail className="w-4 h-4 mr-2" /> Textos e E-mails
        </TabsTrigger>
        <TabsTrigger value="dominios" className="data-[state=active]:bg-background">
          <Globe className="w-4 h-4 mr-2" /> Domínios
        </TabsTrigger>
        <TabsTrigger value="gerais" className="data-[state=active]:bg-background">
          <Settings className="w-4 h-4 mr-2" /> Sistema
        </TabsTrigger>
      </TabsList>

      {/* TAB 1: GATEWAYS */}
      <TabsContent value="gateways" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { id: 'pagarme',     name: 'Pagar.me',      env: envStatus.pagarme,     activeKey: 'gateway_pagarme_active' },
            { id: 'mercadopago', name: 'Mercado Pago',   env: envStatus.mercadopago, activeKey: 'gateway_mercadopago_active' },
            { id: 'stripe',      name: 'Stripe',         env: envStatus.stripe,      activeKey: 'gateway_stripe_active' },
          ].map((gw) => (
            <Card key={gw.id} className="relative">
              <div className="absolute top-4 right-4">
                <Switch
                  checked={form[gw.activeKey] === 'true'}
                  onCheckedChange={(val) => {
                    handleChange(gw.activeKey, val.toString())
                    handleSaveSetting(gw.activeKey)
                  }}
                  disabled={isPending}
                />
              </div>
              <CardHeader>
                <CardTitle className="text-xl">{gw.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {gw.env
                    ? <Badge className="bg-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" />API Configurada</Badge>
                    : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Faltam Env Vars</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b pb-2">
                  <span className="text-muted-foreground">Restaurantes utilizando:</span>
                  <span className="font-bold">{gatewayUsage[gw.id] || 0}</span>
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">URL do Webhook</p>
                  <code className="block text-xs bg-muted p-2 rounded break-all border">
                    {baseUrl}/api/webhooks/{gw.id}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* TAB 2: TEXTOS E E-MAILS */}
      <TabsContent value="emails" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Comunicação e Branding</CardTitle>
            <CardDescription>Personalize os textos base e templates de e-mail disparados pelo sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome da Plataforma</label>
                <div className="flex gap-2">
                  <Input value={form.nome_plataforma || ''} onChange={(e) => handleChange('nome_plataforma', e.target.value)} />
                  <Button variant="secondary" size="icon" onClick={() => handleSaveSetting('nome_plataforma')} disabled={isPending}><Save className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">WhatsApp de Suporte</label>
                <div className="flex gap-2">
                  <Input value={form.suporte_whatsapp || ''} onChange={(e) => handleChange('suporte_whatsapp', e.target.value)} />
                  <Button variant="secondary" size="icon" onClick={() => handleSaveSetting('suporte_whatsapp')} disabled={isPending}><Save className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t">
              <h3 className="text-lg font-semibold">Templates de E-mail</h3>
              {[
                { label: 'E-mail de Boas Vindas',                  prefix: 'email_boas_vindas' },
                { label: 'Alerta de Trial Expirando (3 dias antes)', prefix: 'email_trial_expirando' },
                { label: 'Aviso de Suspensão (Inadimplência)',       prefix: 'email_suspensao' },
              ].map((template) => (
                <div key={template.prefix} className="p-4 bg-muted/30 rounded-lg border space-y-4">
                  <h4 className="font-medium">{template.label}</h4>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Assunto</label>
                    <Input value={form[`${template.prefix}_assunto`] || ''} onChange={(e) => handleChange(`${template.prefix}_assunto`, e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Corpo do E-mail</label>
                    <Textarea rows={3} value={form[`${template.prefix}_corpo`] || ''} onChange={(e) => handleChange(`${template.prefix}_corpo`, e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => {
                      handleSaveSetting(`${template.prefix}_assunto`)
                      handleSaveSetting(`${template.prefix}_corpo`)
                    }} disabled={isPending}>
                      <Save className="w-4 h-4 mr-2" /> Salvar Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB 3: DOMÍNIOS */}
      <TabsContent value="dominios" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Configuração de Domínios
            </CardTitle>
            <CardDescription>
              Defina qual domínio corresponde a cada módulo da plataforma. O middleware irá rotear automaticamente os acessos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {[
              {
                key: 'domain_marketing',
                label: 'Site de Vendas (Marketing)',
                description: 'Landing page pública com planos e cadastro de novos restaurantes.',
                example: 'ex: menuflow.com.br',
              },
              {
                key: 'domain_app',
                label: 'Painel Administrativo',
                description: 'Login e painel do Super Admin e dos Admins de Restaurante.',
                example: 'ex: app.menuflow.com.br',
              },
              {
                key: 'domain_cardapio',
                label: 'Cardápio Público',
                description: 'Cardápio acessado pelos clientes via QR Code ou link de delivery.',
                example: 'ex: cardapio.menuflow.com.br ou use {slug}.menuflow.com.br',
              },
              {
                key: 'domain_kds',
                label: 'Tela da Cozinha (KDS)',
                description: 'Exibição dos pedidos em tempo real para a equipe de cozinha.',
                example: 'ex: cozinha.menuflow.com.br',
              },
            ].map((domain) => (
              <div key={domain.key} className="p-4 border rounded-lg bg-muted/20 space-y-3">
                <div>
                  <h4 className="font-semibold text-sm">{domain.label}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{domain.description}</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={form[domain.key] || ''}
                    onChange={(e) => handleChange(domain.key, e.target.value)}
                    placeholder={domain.example}
                    className="font-mono text-sm"
                    disabled={isPending}
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleSaveSetting(domain.key)}
                    disabled={isPending}
                    title="Salvar"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))}

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
              <strong>Atenção:</strong> Após alterar um domínio, adicione-o também no painel do Cloudflare Pages e aguarde a propagação do DNS (pode levar até 24h). O middleware atualiza automaticamente em até 1 minuto.
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB 4: GERAIS E SISTEMA */}
      <TabsContent value="gerais" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Regras de Negócio</CardTitle>
            <CardDescription>Configurações padrões do SaaS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dias de Trial Padrão (Novos Restaurantes)</label>
              <div className="flex gap-2">
                <Input type="number" value={form.default_trial_days || ''} onChange={(e) => handleChange('default_trial_days', e.target.value)} />
                <Button variant="secondary" onClick={() => handleSaveSetting('default_trial_days')} disabled={isPending}>Salvar</Button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <label className="text-sm font-medium">Taxas Base dos Planos (Leitura)</label>
              <div className="space-y-2">
                {plans.map(plan => (
                  <div key={plan.id} className="flex justify-between items-center bg-muted p-2 rounded text-sm">
                    <span className="uppercase font-semibold text-muted-foreground">{plan.name}</span>
                    <span className="font-bold">{plan.default_fee_pct}%</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Para alterar estas taxas, acesse a aba Planos.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader>
            <CardTitle className="text-orange-700 dark:text-orange-500 flex items-center gap-2">
              <Settings className="w-5 h-5" /> Operações de Suporte
            </CardTitle>
            <CardDescription>Ferramentas avançadas para manutenção da plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border border-orange-200 rounded-lg bg-background">
              <h4 className="font-semibold text-sm mb-1">Forçar Sincronização JWT</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Força a renovação dos metadados de autenticação de todos os usuários. Útil após mudanças massivas em roles diretamente no banco.
              </p>
              <Button
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                onClick={handleSyncRoles}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Sincronizar Roles Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

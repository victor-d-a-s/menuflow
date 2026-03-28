'use client'
export const runtime = 'edge'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { updatePlan, applyOverride } from '../actions'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, Settings2, Percent } from 'lucide-react'

interface Plan {
  id: string
  slug: string
  name: string
  price_monthly: number
  price_annual: number
  default_fee_pct: number
  features?: string[]
  active: boolean
}

interface Restaurant {
  id: string
  name: string
  plan: string
  platform_fee_pct: number
}

// --- CARDS DE PLANOS ---
export function PlanCard({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState({
    name: plan.name,
    price_monthly: plan.price_monthly / 100,
    price_annual: plan.price_annual / 100,
    default_fee_pct: plan.default_fee_pct,
    features: (plan.features || []).join('\n'),
    active: plan.active,
  })

  const handleSave = () => {
    startTransition(async () => {
      const res = await updatePlan(plan.slug, formData)
      if (res.error) toast.error(`Erro: ${res.error}`)
      else toast.success(`Plano ${plan.name} atualizado!`)
    })
  }

  return (
    <Card className={`relative flex flex-col ${!formData.active ? 'opacity-75' : ''}`}>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Ativo</Label>
        <Switch
          checked={formData.active}
          onCheckedChange={(val) => setFormData(p => ({ ...p, active: val }))}
          disabled={isPending}
        />
      </div>
      <CardHeader>
        <CardTitle className="uppercase text-muted-foreground text-sm tracking-wider">[{plan.slug}]</CardTitle>
        <Input
          className="text-2xl font-bold h-10 mt-1"
          value={formData.name}
          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
        />
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Mensal (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price_monthly}
              onChange={(e) => setFormData(p => ({ ...p, price_monthly: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Anual (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.price_annual}
              onChange={(e) => setFormData(p => ({ ...p, price_annual: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Taxa Padrão da Plataforma (%)</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.1"
              value={formData.default_fee_pct}
              onChange={(e) => setFormData(p => ({ ...p, default_fee_pct: Number(e.target.value) }))}
              className="pl-8"
            />
            <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Features (Uma por linha)</Label>
          <Textarea
            rows={5}
            value={formData.features}
            onChange={(e) => setFormData(p => ({ ...p, features: e.target.value }))}
            className="resize-none text-sm"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar {plan.name}
        </Button>
      </CardFooter>
    </Card>
  )
}

// --- OVERRIDE MANAGER ---
export function OverrideForm({ restaurants, plans }: { restaurants: Restaurant[]; plans: Plan[] }) {
  const [isPending, startTransition] = useTransition()

  const [restId, setRestId] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('basico')
  const [customFee, setCustomFee] = useState(2.0)
  const [trialDays, setTrialDays] = useState(0)

  const handleSelectRestaurant = (val: string) => {
    setRestId(val)
    const rest = restaurants.find(r => r.id === val)
    if (rest) {
      setSelectedPlan(rest.plan || 'basico')
      setCustomFee(rest.platform_fee_pct)
    }
  }

  const handleApply = () => {
    if (!restId) return toast.error('Selecione um restaurante.')
    startTransition(async () => {
      const res = await applyOverride({ restaurantId: restId, plan: selectedPlan, customFee, addTrialDays: trialDays })
      if (res.error) toast.error(res.error)
      else {
        toast.success('Condições especiais aplicadas!')
        setTrialDays(0)
      }
    })
  }

  return (
    <Card className="bg-muted/30 border-dashed border-2">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" /> Condições Comerciais Especiais
        </CardTitle>
        <CardDescription>Sobrescreva regras de faturamento e conceda descontos individuais.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <Label>Restaurante</Label>
          <Select value={restId} onValueChange={handleSelectRestaurant}>
            <SelectTrigger><SelectValue placeholder="Buscar..." /></SelectTrigger>
            <SelectContent>
              {restaurants.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Plano</Label>
          <Select value={selectedPlan} onValueChange={setSelectedPlan} disabled={!restId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {plans.map(p => <SelectItem key={p.slug} value={p.slug}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Taxa Personalizada (%)</Label>
          <Input type="number" step="0.1" value={customFee} onChange={e => setCustomFee(Number(e.target.value))} disabled={!restId} />
        </div>
        <div className="space-y-2">
          <Label>Adicionar Dias de Trial</Label>
          <Input type="number" value={trialDays} onChange={e => setTrialDays(Number(e.target.value))} disabled={!restId} />
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleApply} disabled={!restId || isPending}>
          {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Aplicar Override
        </Button>
      </CardFooter>
    </Card>
  )
}

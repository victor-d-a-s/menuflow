'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { productSchema, type ProductInput, createProduct, updateProduct } from '../actions'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface Category { id: string; name: string }
interface ProductData {
  id?: string
  name: string
  description?: string
  price: number
  category_id: string
  active: boolean
}

type ProductSheetProps = {
  restaurantId: string
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ProductData | null
}

export function ProductSheet({ restaurantId, categories, open, onOpenChange, initialData }: ProductSheetProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category_id: '',
      active: true,
    },
  })

  useEffect(() => {
    if (initialData && open) {
      form.reset({
        name: initialData.name,
        description: initialData.description || '',
        price: initialData.price / 100, // Converte centavos para reais para edição
        category_id: initialData.category_id,
        active: initialData.active,
      })
    } else if (!open) {
      form.reset()
    }
  }, [initialData, open, form])

  const onSubmit = (data: ProductInput) => {
    startTransition(async () => {
      let res
      if (initialData?.id) {
        res = await updateProduct(initialData.id, restaurantId, data)
      } else {
        res = await createProduct(restaurantId, data)
      }

      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(`Produto ${initialData?.id ? 'atualizado' : 'criado'} com sucesso!`)
        onOpenChange(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{initialData?.id ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
          <SheetDescription>Preencha os detalhes do item no cardápio.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="category_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Produto *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$) *</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="active" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                <FormLabel className="!mt-0">Produto Ativo</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData?.id ? 'Salvar Alterações' : 'Criar Produto'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

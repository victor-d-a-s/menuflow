'use client'
export const runtime = 'edge'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createCategory, updateCategory, deleteCategory, createProduct, updateProduct, toggleProduct, deleteProduct, type ProductInput } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react'

type Category = { id: string; name: string; sort_order: number }
type Product = { id: string; name: string; description?: string; price: number; active: boolean; category_id?: string }

const productSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço inválido'),
  category_id: z.string().uuid('Categoria obrigatória'),
  active: z.boolean().default(true),
})

export function CardapioManager({ categories: initialCats, products }: { categories: Category[], products: Product[] }) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCats)
  const [newCatName, setNewCatName] = useState('')
  const [editingCat, setEditingCat] = useState<{ id: string; name: string } | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', price: 0, category_id: '', active: true },
  })

  const openNewProduct = (categoryId?: string) => {
    form.reset({ name: '', description: '', price: 0, category_id: categoryId || '', active: true })
    setEditingProduct(null)
    setSheetOpen(true)
  }

  const openEditProduct = (product: Product) => {
    form.reset({
      name: product.name,
      description: product.description || '',
      price: product.price / 100,
      category_id: product.category_id || '',
      active: product.active,
    })
    setEditingProduct(product)
    setSheetOpen(true)
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    startTransition(async () => {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0
      const res = await createCategory(newCatName, maxOrder + 1)
      if (res.error) toast.error(res.error)
      else { toast.success('Categoria criada!'); setNewCatName('') }
    })
  }

  const handleUpdateCategory = () => {
    if (!editingCat) return
    startTransition(async () => {
      const res = await updateCategory(editingCat.id, editingCat.name)
      if (res.error) toast.error(res.error)
      else setEditingCat(null)
    })
  }

  const handleDeleteCategory = (id: string) => {
    startTransition(async () => {
      const res = await deleteCategory(id)
      if (res.error) toast.error(res.error)
      else toast.success('Categoria excluída!')
    })
  }

  const handleToggleProduct = (id: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleProduct(id, !current)
      if (res.error) toast.error(res.error)
    })
  }

  const handleDeleteProduct = (id: string) => {
    startTransition(async () => {
      const res = await deleteProduct(id)
      if (res.error) toast.error(res.error)
      else toast.success('Produto excluído!')
    })
  }

  const onSubmitProduct = (data: ProductInput) => {
    startTransition(async () => {
      const res = editingProduct
        ? await updateProduct(editingProduct.id, data)
        : await createProduct(data)
      if (res.error) toast.error(res.error)
      else {
        toast.success(editingProduct ? 'Produto atualizado!' : 'Produto criado!')
        setSheetOpen(false)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Adicionar categoria */}
      <div className="flex gap-2 items-center bg-card border rounded-xl p-4">
        <Input
          placeholder="Nova categoria (ex: Entradas, Bebidas...)"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
          className="flex-1"
          disabled={isPending}
        />
        <Button onClick={handleAddCategory} disabled={!newCatName.trim() || isPending}>
          <Plus className="w-4 h-4 mr-2" />Adicionar
        </Button>
        <Button variant="secondary" onClick={() => openNewProduct()}>
          <Plus className="w-4 h-4 mr-2" />Novo Produto
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhuma categoria criada ainda.</p>
          <p className="text-sm mt-1">Crie uma categoria acima para começar a adicionar produtos.</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-3">
          {categories.map(cat => {
            const catProducts = products.filter(p => p.category_id === cat.id)
            return (
              <AccordionItem key={cat.id} value={cat.id} className="border bg-card rounded-xl px-4">
                <div className="flex items-center gap-2 py-2 border-b">
                  {editingCat?.id === cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        autoFocus
                        value={editingCat.name}
                        onChange={e => setEditingCat({ ...editingCat, name: e.target.value })}
                        className="h-8"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleUpdateCategory}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingCat(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <AccordionTrigger className="flex-1 hover:no-underline py-2 text-base font-semibold justify-start gap-3">
                      {cat.name}
                      <Badge variant="secondary" className="text-xs font-normal">{catProducts.length} produtos</Badge>
                    </AccordionTrigger>
                  )}

                  {!editingCat && (
                    <div className="flex gap-1 ml-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => setEditingCat({ id: cat.id, name: cat.name })}>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => openNewProduct(cat.id)}>
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir "{cat.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {catProducts.length > 0
                                ? `Não é possível excluir — existem ${catProducts.length} produto(s). Remova-os primeiro.`
                                : 'Esta ação é irreversível.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={catProducts.length > 0 || isPending}
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="bg-red-600">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>

                <AccordionContent className="pt-3 pb-2 space-y-2">
                  {catProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Nenhum produto. <button onClick={() => openNewProduct(cat.id)} className="text-[#c8410a] hover:underline">Adicionar produto</button>
                    </p>
                  ) : catProducts.map(product => (
                    <div key={product.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${product.active ? 'bg-background' : 'bg-muted/40 opacity-70'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                        )}
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">
                          {(product.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Switch
                          checked={product.active}
                          onCheckedChange={() => handleToggleProduct(product.id, product.active)}
                          disabled={isPending}
                        />
                        <Button size="icon" variant="ghost" onClick={() => openEditProduct(product)}>
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="hover:text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir "{product.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id)} className="bg-red-600">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      )}

      {/* Sheet de produto */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</SheetTitle>
            <SheetDescription>Preencha os detalhes do item no cardápio.</SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitProduct)} className="space-y-4">
              <FormField control={form.control} name="category_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                    <SelectContent position="popper">
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
                  <FormLabel>Nome *</FormLabel>
                  <FormControl><Input placeholder="Ex: Pizza Margherita" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea placeholder="Descrição opcional..." className="resize-none" rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$) *</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0" placeholder="0,00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center justify-between border p-3 rounded-lg">
                  <FormLabel className="!mt-0">Produto Ativo</FormLabel>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingProduct ? 'Salvar' : 'Criar Produto'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

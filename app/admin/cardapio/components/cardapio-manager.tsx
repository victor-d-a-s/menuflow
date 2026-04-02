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
const schema = z.object({ name: z.string().min(1), description: z.string().optional(), price: z.coerce.number().min(0), category_id: z.string().uuid(), active: z.boolean().default(true) })

export function CardapioManager({ categories: initialCats, products }: { categories: Category[], products: Product[] }) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCats)
  const [newCatName, setNewCatName] = useState('')
  const [editingCat, setEditingCat] = useState<{id:string;name:string}|null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product|null>(null)
  const form = useForm<ProductInput>({ resolver: zodResolver(schema), defaultValues: { name:'', description:'', price:0, category_id:'', active:true } })

  const openNew = (catId?: string) => { form.reset({ name:'', description:'', price:0, category_id: catId||'', active:true }); setEditingProduct(null); setSheetOpen(true) }
  const openEdit = (p: Product) => { form.reset({ name:p.name, description:p.description||'', price:p.price/100, category_id:p.category_id||'', active:p.active }); setEditingProduct(p); setSheetOpen(true) }

  const handleAddCat = () => { if (!newCatName.trim()) return; startTransition(async () => { const max = categories.length > 0 ? Math.max(...categories.map(c=>c.sort_order)) : 0; const res = await createCategory(newCatName, max+1); if (res.error) toast.error(res.error); else { toast.success('Categoria criada!'); setNewCatName('') } }) }
  const handleUpdateCat = () => { if (!editingCat) return; startTransition(async () => { const res = await updateCategory(editingCat.id, editingCat.name); if (res.error) toast.error(res.error); else setEditingCat(null) }) }
  const handleDeleteCat = (id: string) => startTransition(async () => { const res = await deleteCategory(id); if (res.error) toast.error(res.error); else toast.success('Categoria excluída!') })
  const handleToggle = (id: string, current: boolean) => startTransition(async () => { const res = await toggleProduct(id, !current); if (res.error) toast.error(res.error) })
  const handleDeleteProd = (id: string) => startTransition(async () => { const res = await deleteProduct(id); if (res.error) toast.error(res.error); else toast.success('Produto excluído!') })
  const onSubmit = (data: ProductInput) => startTransition(async () => {
    const res = editingProduct ? await updateProduct(editingProduct.id, data) : await createProduct(data)
    if (res.error) toast.error(res.error); else { toast.success(editingProduct ? 'Produto atualizado!' : 'Produto criado!'); setSheetOpen(false) }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center bg-card border rounded-xl p-4">
        <Input placeholder="Nova categoria..." value={newCatName} onChange={e=>setNewCatName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddCat()} className="flex-1 min-w-40" disabled={isPending} />
        <Button onClick={handleAddCat} disabled={!newCatName.trim()||isPending}><Plus className="w-4 h-4 mr-2"/>Categoria</Button>
        <Button variant="secondary" onClick={()=>openNew()}><Plus className="w-4 h-4 mr-2"/>Produto</Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-card"><p>Nenhuma categoria. Crie uma acima.</p></div>
      ) : (
        <Accordion type="multiple" defaultValue={categories.map(c=>c.id)} className="space-y-3">
          {categories.map(cat => {
            const catProds = products.filter(p=>p.category_id===cat.id)
            return (
              <AccordionItem key={cat.id} value={cat.id} className="border bg-card rounded-xl px-4">
                <div className="flex items-center gap-2 py-2 border-b">
                  {editingCat?.id===cat.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input autoFocus value={editingCat.name} onChange={e=>setEditingCat({...editingCat,name:e.target.value})} className="h-8"/>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={handleUpdateCat}><Check className="w-4 h-4"/></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={()=>setEditingCat(null)}><X className="w-4 h-4"/></Button>
                    </div>
                  ) : (
                    <AccordionTrigger className="flex-1 hover:no-underline py-2 text-base font-semibold justify-start gap-3">
                      {cat.name}<Badge variant="secondary" className="text-xs font-normal">{catProds.length}</Badge>
                    </AccordionTrigger>
                  )}
                  {!editingCat && (
                    <div className="flex gap-1 ml-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={()=>setEditingCat({id:cat.id,name:cat.name})}><Edit2 className="w-4 h-4 text-muted-foreground"/></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={()=>openNew(cat.id)}><Plus className="w-4 h-4 text-muted-foreground"/></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-8 w-8 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir "{cat.name}"?</AlertDialogTitle><AlertDialogDescription>{catProds.length>0?`Remova os ${catProds.length} produto(s) primeiro.`:'Esta ação é irreversível.'}</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction disabled={catProds.length>0||isPending} onClick={()=>handleDeleteCat(cat.id)} className="bg-red-600">Excluir</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <AccordionContent className="pt-3 pb-2 space-y-2">
                  {catProds.length===0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">Nenhum produto. <button onClick={()=>openNew(cat.id)} className="text-[#c8410a] hover:underline">Adicionar</button></p>
                  ) : catProds.map(product => (
                    <div key={product.id} className={`flex items-center justify-between p-3 rounded-lg border ${product.active?'bg-background':'bg-muted/40 opacity-70'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        {product.description&&<p className="text-xs text-muted-foreground truncate">{product.description}</p>}
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">{(product.price/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Switch checked={product.active} onCheckedChange={()=>handleToggle(product.id,product.active)} disabled={isPending}/>
                        <Button size="icon" variant="ghost" onClick={()=>openEdit(product)}><Edit2 className="w-4 h-4 text-blue-600"/></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="hover:text-red-600"><Trash2 className="w-4 h-4"/></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir "{product.name}"?</AlertDialogTitle><AlertDialogDescription>Irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={()=>handleDeleteProd(product.id)} className="bg-red-600">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6"><SheetTitle>{editingProduct?'Editar Produto':'Novo Produto'}</SheetTitle><SheetDescription>Preencha os detalhes do item.</SheetDescription></SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="category_id" render={({field})=>(<FormItem><FormLabel>Categoria *</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger></FormControl><SelectContent position="popper">{categories.map(cat=><SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>
              <FormField control={form.control} name="name" render={({field})=>(<FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="Ex: Pizza Margherita" {...field}/></FormControl><FormMessage/></FormItem>)}/>
              <FormField control={form.control} name="description" render={({field})=>(<FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Opcional..." className="resize-none" rows={2} {...field}/></FormControl><FormMessage/></FormItem>)}/>
              <FormField control={form.control} name="price" render={({field})=>(<FormItem><FormLabel>Preço (R$) *</FormLabel><FormControl><Input type="number" step="0.01" min="0" placeholder="0,00" {...field}/></FormControl><FormMessage/></FormItem>)}/>
              <FormField control={form.control} name="active" render={({field})=>(<FormItem className="flex items-center justify-between border p-3 rounded-lg"><FormLabel className="!mt-0">Produto Ativo</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={()=>setSheetOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="flex-1">{isPending&&<Loader2 className="w-4 h-4 mr-2 animate-spin"/>}{editingProduct?'Salvar':'Criar'}</Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

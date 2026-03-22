'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Check, X } from 'lucide-react'

import { createCategory, updateCategory, deleteCategory, updateCategoryOrders, deleteProduct, toggleProductActive } from '../actions'
import { ProductSheet } from './product-sheet'

interface Category { id: string; name: string; sort_order: number; restaurant_id: string }
interface Product { id: string; name: string; description?: string; price: number; active: boolean; category_id?: string; restaurant_id: string }

type MenuManagerProps = {
  restaurantId: string
  categories: Category[]
  products: Product[]
}

export function MenuManager({ restaurantId, categories: initialCategories, products }: MenuManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState(initialCategories)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    startTransition(async () => {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0
      const res = await createCategory(restaurantId, newCatName, maxOrder + 1)
      if (res.error) toast.error(res.error)
      else { toast.success('Categoria criada'); setNewCatName('') }
    })
  }

  const handleUpdateCategoryName = (id: string) => {
    if (!editingCatName.trim()) return setEditingCatId(null)
    startTransition(async () => {
      const res = await updateCategory(id, restaurantId, editingCatName)
      if (res.error) toast.error(res.error)
      setEditingCatId(null)
    })
  }

  const handleDeleteCategory = (id: string) => {
    startTransition(async () => {
      const res = await deleteCategory(id, restaurantId)
      if (res.error) toast.error(res.error)
      else toast.success('Categoria excluída')
    })
  }

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return

    const newCategories = [...categories]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const tempOrder = newCategories[index].sort_order
    newCategories[index].sort_order = newCategories[swapIndex].sort_order
    newCategories[swapIndex].sort_order = tempOrder
    newCategories.sort((a, b) => a.sort_order - b.sort_order)
    setCategories(newCategories)

    startTransition(async () => {
      await updateCategoryOrders(restaurantId, [
        { id: newCategories[index].id, sort_order: newCategories[index].sort_order },
        { id: newCategories[swapIndex].id, sort_order: newCategories[swapIndex].sort_order },
      ])
    })
  }

  const openNewProductSheet = () => { setProductToEdit(null); setSheetOpen(true) }
  const openEditProductSheet = (product: Product) => { setProductToEdit(product); setSheetOpen(true) }

  const handleToggleProduct = (id: string, currentActive: boolean) => {
    startTransition(async () => {
      const res = await toggleProductActive(id, restaurantId, !currentActive)
      if (res?.error) toast.error(res.error)
    })
  }

  const handleDeleteProduct = (id: string) => {
    startTransition(async () => {
      const res = await deleteProduct(id, restaurantId)
      if (res?.error) toast.error(res.error)
      else toast.success('Produto excluído')
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 border rounded-lg">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Nova categoria..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            disabled={isPending}
          />
          <Button onClick={handleAddCategory} disabled={!newCatName.trim() || isPending}>
            <Plus className="w-4 h-4 mr-2" />Adicionar
          </Button>
        </div>
        <Button onClick={openNewProductSheet} variant="secondary">
          <Plus className="w-4 h-4 mr-2" />Novo Produto
        </Button>
      </div>

      <Accordion type="multiple" className="w-full space-y-4">
        {categories.map((cat, index) => {
          const categoryProducts = products.filter(p => p.category_id === cat.id)

          return (
            <AccordionItem key={cat.id} value={cat.id} className="border bg-card rounded-lg px-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center flex-1">
                  {editingCatId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        autoFocus
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        className="h-8 w-64"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleUpdateCategoryName(cat.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => setEditingCatId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <AccordionTrigger className="hover:no-underline py-2 text-lg font-semibold flex-1 justify-start gap-4">
                      {cat.name}
                      <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">{categoryProducts.length} itens</span>
                    </AccordionTrigger>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-4">
                  {!editingCatId && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingCatName(cat.name); setEditingCatId(cat.id) }}>
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                  <div className="flex flex-col gap-0 border-l pl-1 ml-1">
                    <Button size="icon" variant="ghost" className="h-4 w-6" disabled={index === 0 || isPending} onClick={() => handleMoveCategory(index, 'up')}>
                      <ArrowUp className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-4 w-6" disabled={index === categories.length - 1 || isPending} onClick={() => handleMoveCategory(index, 'down')}>
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 ml-2 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {categoryProducts.length > 0
                            ? `Não é possível excluir "${cat.name}" — ela contém ${categoryProducts.length} produto(s). Remova ou mova os produtos primeiro.`
                            : `Tem certeza que deseja excluir "${cat.name}"?`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <Button variant="destructive" disabled={categoryProducts.length > 0 || isPending} onClick={() => handleDeleteCategory(cat.id)}>
                          Excluir
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <AccordionContent className="pt-4 pb-2">
                {categoryProducts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">Nenhum produto nesta categoria.</div>
                ) : (
                  <div className="space-y-3">
                    {categoryProducts.map(product => (
                      <div key={product.id} className={`flex items-center justify-between p-3 rounded-md border ${product.active ? 'bg-background' : 'bg-muted/50 opacity-70'}`}>
                        <div className="flex-1">
                          <h4 className="font-medium text-base">{product.name}</h4>
                          {product.description && <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>}
                          <p className="text-sm font-semibold mt-1 text-emerald-600">
                            {(product.price / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 ml-4">
                          <Switch
                            checked={product.active}
                            onCheckedChange={() => handleToggleProduct(product.id, product.active)}
                            disabled={isPending}
                          />
                          <div className="flex gap-1 border-l pl-4">
                            <Button size="icon" variant="ghost" onClick={() => openEditProductSheet(product)}>
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir {product.name}?</AlertDialogTitle>
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
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <ProductSheet
        restaurantId={restaurantId}
        categories={categories}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialData={productToEdit}
      />
    </div>
  )
}

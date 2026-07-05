import React, { useState, useMemo } from 'react'
import { useProducts } from 'src/features/menu/hooks/useProducts'
import type { Product, CategoryType } from 'src/features/menu/types'
import { Input } from 'src/components/ui/input'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import { Search, Plus, Trash2 } from 'lucide-react'
import { AddMenuDialog, EditMenuDialog, MenuTable } from './menu'
import { useTranslation } from '../../../../hooks/useTranslation'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from 'src/components/ui/alert-dialog'

export const MenuManagement: React.FC = () => {
  const { t } = useTranslation()
  const {
    products,
    categories,
    loading,
    submitting,
    addProduct,
    editProduct,
    deleteProduct,
  } = useProducts()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | CategoryType>('all')

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  // Shared form states
  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryType>('coffee')
  const [price, setPrice] = useState(0)
  const [image, setImage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [stockCount, setStockCount] = useState(50)
  const [available, setAvailable] = useState(true)

  // ── Helpers ──────────────────────────────────────────────────────────────

  const resetForm = () => {
    setName('')
    setCategory('coffee')
    setPrice(0)
    setImage('')
    setImageFile(null)
    setStockCount(50)
    setAvailable(true)
    setEditingProduct(null)
  }

  const startEdit = (product: Product) => {
    setEditingProduct(product)
    setName(product.name)
    setCategory(product.category)
    setPrice(product.price)
    setImage(product.image)
    setStockCount(product.stockCount)
    setAvailable(product.available)
  }

  // ── Submit handlers ───────────────────────────────────────────────────────

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const categoryPresets: Record<CategoryType, string> = {
      coffee: 'https://images.unsplash.com/photo-1510707577719-09411968651c?w=400&auto=format&fit=crop&q=80',
      tea: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80',
      snack: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80',
      main_course: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop&q=80',
    }

    await addProduct({
      name,
      category,
      price,
      image: image || categoryPresets[category],
      stockCount,
      available,
    }, imageFile)

    setIsAddOpen(false)
    resetForm()
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct || !name.trim()) return

    await editProduct({
      id: editingProduct.id,
      name,
      category,
      price,
      image: image || editingProduct.image,
      stockCount,
      available,
    }, imageFile)

    resetForm()
  }

  const handleDeleteClick = (id: string, productName: string) => {
    setDeleteTarget({ id, name: productName })
  }

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  const handleToggleAvailable = (product: Product) => {
    editProduct({ ...product, available: !product.available })
  }

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategoryTab === 'all' || product.category === selectedCategoryTab
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategoryTab, searchQuery])

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>

        {/* Toolbar Skeleton */}
        <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />

        {/* Table/List Skeleton */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border">
          <div className="h-12 border-b bg-zinc-50 dark:bg-zinc-900 rounded-t-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="pb-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('menuManagement.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('menuManagement.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsAddOpen(true)
          }}
          className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer self-start md:self-auto gap-2"
        >
          <Plus className="size-4" /> {t('menuManagement.addNewItem')}
        </Button>
      </div>

      {/* Tabs & Toolbar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg w-full md:w-auto">
            <button
              onClick={() => setSelectedCategoryTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${selectedCategoryTab === 'all'
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t('menuManagement.allItems')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryTab(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${selectedCategoryTab === cat.id
                  ? 'bg-[#0A422D] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {t(`menuManagement.categories.${cat.id}`, cat.name)}
                <Badge variant="secondary" className={`px-1.5 rounded-full py-0 text-[10px] ${selectedCategoryTab === cat.id ? 'bg-white/20 text-white' : 'bg-muted-foreground/10 text-foreground'}`}>
                  {cat.itemCount}
                </Badge>
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="text"
              placeholder={t('menuManagement.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white pl-9 h-9"
            />
          </div>
        </div>
      </div>

      {/* Menu List Table */}
      <MenuTable
        products={filteredProducts}
        onEdit={startEdit}
        onDelete={handleDeleteClick}
        onToggleAvailable={handleToggleAvailable}
      />

      {/* Add Product Dialog */}
      <AddMenuDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddSubmit}
        submitting={submitting}
        name={name}
        setName={setName}
        category={category}
        setCategory={setCategory}
        price={price}
        setPrice={setPrice}
        image={image}
        setImage={setImage}
        imageFile={imageFile}
        setImageFile={setImageFile}
        stockCount={stockCount}
        setStockCount={setStockCount}
        available={available}
        setAvailable={setAvailable}
      />

      {/* Edit Product Dialog */}
      <EditMenuDialog
        editingProduct={editingProduct}
        onClose={() => { setEditingProduct(null); resetForm() }}
        onSubmit={handleEditSubmit}
        submitting={submitting}
        name={name}
        setName={setName}
        category={category}
        setCategory={setCategory}
        price={price}
        setPrice={setPrice}
        image={image}
        setImage={setImage}
        imageFile={imageFile}
        setImageFile={setImageFile}
        stockCount={stockCount}
        setStockCount={setStockCount}
        available={available}
        setAvailable={setAvailable}
      />

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <Trash2 className="size-5 text-red-500" />
            <AlertDialogTitle className="flex items-center gap-2">
              {t('menuManagement.deleteTitle', 'Delete Item')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('menuManagement.confirmDelete', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t('menuManagement.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              {t('menuManagement.deleteBtn', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

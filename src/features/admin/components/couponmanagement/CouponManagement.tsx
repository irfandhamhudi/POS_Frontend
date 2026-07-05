import React, { useState, useEffect, useCallback } from 'react'
import api from 'src/api'
import { formatCurrency } from 'src/lib/utils'
import { Card, CardContent } from 'src/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { useTranslation } from '../../../../hooks/useTranslation'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import { Input } from 'src/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'src/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import { Search, Plus, Pencil, Trash2, Tag, Ticket, Gift, Package, Repeat } from 'lucide-react'

interface Product {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

interface Coupon {
  _id: string
  code: string
  description: string
  promotionType: 'coupon' | 'bogo' | 'free_item' | 'bundle' | 'buy_x_get_y'
  type: 'percentage' | 'fixed'
  value: number
  minOrder: number
  maxDiscount: number
  usageLimit: number
  usedCount: number
  expiryDate: string
  active: boolean
  buyQuantity: number
  getQuantity: number
  targetProducts: Product[]
  freeProducts: { product: Product; quantity: number }[]
  minItems: number
  applicableCategories: string[]
  stackable: boolean
}

const PROMO_TYPE_ICONS: Record<string, React.ReactNode> = {
  coupon: <Tag className="size-3.5 text-[#0A422D]" />,
  bogo: <Repeat className="size-3.5 text-purple-600" />,
  free_item: <Gift className="size-3.5 text-pink-600" />,
  bundle: <Package className="size-3.5 text-blue-600" />,
  buy_x_get_y: <Repeat className="size-3.5 text-amber-600" />,
};

const PROMO_TYPE_LABELS: Record<string, string> = {
  coupon: 'Coupon',
  bogo: 'BOGO',
  free_item: 'Free Item',
  bundle: 'Bundle',
  buy_x_get_y: 'Buy X Get Y',
};

export const CouponManagement: React.FC = () => {
  const { t } = useTranslation()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)

  const [form, setForm] = useState({
    code: '',
    description: '',
    promotionType: 'coupon' as 'coupon' | 'bogo' | 'free_item' | 'bundle' | 'buy_x_get_y',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    expiryDate: '',
    active: true,
    buyQuantity: '2',
    getQuantity: '1',
    targetProductIds: [] as string[],
    freeProductEntries: [] as { productId: string; quantity: string }[],
    minItems: '',
    stackable: false,
  })

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await api.get('/coupons')
      if (res.data.success) setCoupons(res.data.data)
    } catch (error) {
      console.error('Failed to fetch coupons', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/products')
      if (res.data.success) setProducts(res.data.data)
    } catch (error) {
      console.error('Failed to fetch products', error)
    }
  }, [])

  useEffect(() => { fetchCoupons(); fetchProducts(); }, [fetchCoupons, fetchProducts])

  const filteredCoupons = coupons.filter(c =>
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    PROMO_TYPE_LABELS[c.promotionType]?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const resetForm = () => {
    setForm({
      code: '', description: '', promotionType: 'coupon', type: 'percentage',
      value: '', minOrder: '', maxDiscount: '', usageLimit: '', expiryDate: '',
      active: true, buyQuantity: '2', getQuantity: '1', targetProductIds: [],
      freeProductEntries: [], minItems: '', stackable: false,
    })
    setEditingCoupon(null)
  }

  const openCreate = () => { resetForm(); setIsFormOpen(true); }

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description,
      promotionType: coupon.promotionType || 'coupon',
      type: coupon.type,
      value: coupon.value.toString(),
      minOrder: coupon.minOrder.toString(),
      maxDiscount: coupon.maxDiscount.toString(),
      usageLimit: coupon.usageLimit.toString(),
      expiryDate: new Date(coupon.expiryDate).toISOString().split('T')[0],
      active: coupon.active,
      buyQuantity: (coupon.buyQuantity || 2).toString(),
      getQuantity: (coupon.getQuantity || 1).toString(),
      targetProductIds: coupon.targetProducts?.map(p => p._id) || [],
      freeProductEntries: coupon.freeProducts?.map(fp => ({
        productId: fp.product?._id || '',
        quantity: (fp.quantity || 1).toString(),
      })) || [],
      minItems: (coupon.minItems || 0).toString(),
      stackable: coupon.stackable || false,
    })
    setIsFormOpen(true)
  }

  const handleSave = async () => {
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        description: form.description,
        promotionType: form.promotionType,
        type: form.type,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        usageLimit: Number(form.usageLimit) || 0,
        expiryDate: form.expiryDate,
        active: form.active,
        buyQuantity: Number(form.buyQuantity) || 2,
        getQuantity: Number(form.getQuantity) || 1,
        targetProducts: form.targetProductIds,
        freeProducts: form.freeProductEntries
          .filter(fp => fp.productId)
          .map(fp => ({ product: fp.productId, quantity: Number(fp.quantity) || 1 })),
        minItems: Number(form.minItems) || 0,
        stackable: form.stackable,
      }

      if (editingCoupon) {
        const res = await api.put(`/coupons/${editingCoupon._id}`, payload)
        if (res.data.success) {
          setCoupons(prev => prev.map(c => c._id === editingCoupon._id ? res.data.data : c))
        }
      } else {
        const res = await api.post('/coupons', payload)
        if (res.data.success) {
          setCoupons(prev => [res.data.data, ...prev])
        }
      }
      setIsFormOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('Failed to save coupon', error)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await api.delete(`/coupons/${deleteTarget._id}`)
      if (res.data.success) {
        setCoupons(prev => prev.filter(c => c._id !== deleteTarget._id))
      }
    } catch (error) {
      console.error('Failed to delete coupon', error)
    }
    setDeleteTarget(null)
  }

  const isExpired = (date: string) => new Date(date) < new Date()

  const toggleTargetProduct = (productId: string) => {
    setForm(p => ({
      ...p,
      targetProductIds: p.targetProductIds.includes(productId)
        ? p.targetProductIds.filter(id => id !== productId)
        : [...p.targetProductIds, productId],
    }))
  }

  const addFreeProduct = () => {
    setForm(p => ({
      ...p,
      freeProductEntries: [...p.freeProductEntries, { productId: '', quantity: '1' }],
    }))
  }

  const removeFreeProduct = (index: number) => {
    setForm(p => ({
      ...p,
      freeProductEntries: p.freeProductEntries.filter((_, i) => i !== index),
    }))
  }

  const updateFreeProduct = (index: number, field: string, value: string) => {
    setForm(p => ({
      ...p,
      freeProductEntries: p.freeProductEntries.map((fp, i) =>
        i === index ? { ...fp, [field]: value } : fp
      ),
    }))
  }

  const showTargetProducts = ['bogo', 'free_item', 'bundle', 'buy_x_get_y'].includes(form.promotionType)
  const showFreeProducts = ['free_item', 'buy_x_get_y'].includes(form.promotionType)
  const showBogoFields = ['bogo', 'buy_x_get_y'].includes(form.promotionType)

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div><div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" /></div>
        <div className="bg-white dark:bg-zinc-950 rounded-lg border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="pb-4 border-b border-border/40 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('couponManagement.title', 'Promotions & Coupons')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('couponManagement.subtitle', 'Create coupons, BOGO deals, free items, and bundle promotions')}</p>
        </div>
        <Button onClick={openCreate} className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer">
          <Plus className="size-4 mr-1.5" /> {t('couponManagement.addCoupon', 'Add Promotion')}
        </Button>
      </div>

      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input type="text" placeholder={t('couponManagement.searchPlaceholder', 'Search promotions...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white pl-9 h-9" />
        </div>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('couponManagement.table.code', 'Code')}</TableHead>
                <TableHead>{t('couponManagement.table.type', 'Type')}</TableHead>
                <TableHead>{t('couponManagement.table.promoType', 'Promotion')}</TableHead>
                <TableHead>{t('couponManagement.table.value', 'Value')}</TableHead>
                <TableHead>{t('couponManagement.table.minOrder', 'Min Order')}</TableHead>
                <TableHead>{t('couponManagement.table.usage', 'Usage')}</TableHead>
                <TableHead>{t('couponManagement.table.expiry', 'Expiry')}</TableHead>
                <TableHead>{t('couponManagement.table.status', 'Status')}</TableHead>
                <TableHead className="text-right">{t('couponManagement.table.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
                <TableRow key={coupon._id} className="hover:bg-muted/30">
                  <TableCell className="font-bold text-[13px]">
                    <span className="flex items-center gap-1.5"><Ticket className="size-3.5 text-[#0A422D]" />{coupon.code}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.type === 'percentage' ? 'default' : 'secondary'} className="rounded text-[10px] py-0 h-4">
                      {coupon.type === 'percentage' ? '%' : 'Rp'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-xs">
                      {PROMO_TYPE_ICONS[coupon.promotionType]}
                      {PROMO_TYPE_LABELS[coupon.promotionType]}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold">
                    {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    {coupon.promotionType === 'bogo' && (
                      <span className="text-[10px] text-muted-foreground block">Buy {coupon.buyQuantity} Get {coupon.getQuantity}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{coupon.minOrder > 0 ? formatCurrency(coupon.minOrder) : '-'}</TableCell>
                  <TableCell className="text-xs font-semibold">{coupon.usedCount}{coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ''}</TableCell>
                  <TableCell className="text-xs">{new Date(coupon.expiryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell>
                    {isExpired(coupon.expiryDate) ? (
                      <Badge variant="destructive" className="rounded text-[10px] py-0 h-4">Expired</Badge>
                    ) : !coupon.active ? (
                      <Badge variant="secondary" className="rounded text-[10px] py-0 h-4">Inactive</Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded text-[10px] py-0 h-4 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="icon-xs" variant="outline" onClick={() => openEdit(coupon)} className="cursor-pointer"><Pencil className="size-3" /></Button>
                      <Button size="icon-xs" variant="destructive" onClick={() => setDeleteTarget(coupon)} className="cursor-pointer"><Trash2 className="size-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredCoupons.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">No promotions found.</div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); resetForm() } }}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6 text-left shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
            <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none">
              {editingCoupon ? 'Edit Promotion' : 'Create Promotion'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 block">
              {editingCoupon ? 'Update the promotion details below.' : 'Set up a new coupon or promotion.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4 text-xs">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Promo Code *</label>
                <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. BOGO50" className="uppercase tracking-wider font-bold" disabled={!!editingCoupon} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Promotion Type *</label>
                <select value={form.promotionType} onChange={(e) => setForm(p => ({ ...p, promotionType: e.target.value as any }))} className="h-9 px-3 border border-input bg-background rounded-lg text-sm cursor-pointer">
                  <option value="coupon">Standard Coupon</option>
                  <option value="bogo">Buy One Get One</option>
                  <option value="free_item">Free Item</option>
                  <option value="bundle">Bundle Discount</option>
                  <option value="buy_x_get_y">Buy X Get Y</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-gray-700 dark:text-gray-300">Description</label>
              <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional description" />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Discount Type *</label>
                <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value as any }))} className="h-9 px-3 border border-input bg-background rounded-lg text-sm cursor-pointer">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rp)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Value *</label>
                <Input type="number" min="0" value={form.value} onChange={(e) => setForm(p => ({ ...p, value: e.target.value }))} placeholder={form.type === 'percentage' ? 'e.g. 10' : 'e.g. 5000'} />
              </div>
            </div>

            {/* BOGO / Buy X Get Y fields */}
            {showBogoFields && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-900/50 rounded-lg">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-purple-700 dark:text-purple-400">Buy Quantity</label>
                  <Input type="number" min="1" value={form.buyQuantity} onChange={(e) => setForm(p => ({ ...p, buyQuantity: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-purple-700 dark:text-purple-400">Get Quantity</label>
                  <Input type="number" min="1" value={form.getQuantity} onChange={(e) => setForm(p => ({ ...p, getQuantity: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Min Order (Rp)</label>
                <Input type="number" min="0" value={form.minOrder} onChange={(e) => setForm(p => ({ ...p, minOrder: e.target.value }))} placeholder="0" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Max Discount (Rp)</label>
                <Input type="number" min="0" value={form.maxDiscount} onChange={(e) => setForm(p => ({ ...p, maxDiscount: e.target.value }))} placeholder="0" disabled={form.type === 'fixed'} />
              </div>
            </div>

            {/* Usage & Expiry */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Usage Limit</label>
                <Input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm(p => ({ ...p, usageLimit: e.target.value }))} placeholder="0 = unlimited" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">Expiry Date *</label>
                <Input type="date" value={form.expiryDate} onChange={(e) => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
              </div>
            </div>

            {/* Target Products */}
            {showTargetProducts && (
              <div className="flex flex-col gap-2 p-3 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                <label className="font-bold text-blue-700 dark:text-blue-400 text-xs">Target Products</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {products.map(product => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => toggleTargetProduct(product._id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${form.targetProductIds.includes(product._id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-800 text-gray-600 border-gray-200 dark:border-zinc-700 hover:bg-blue-50'
                        }`}
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-blue-600 font-medium">{form.targetProductIds.length} product(s) selected</span>
              </div>
            )}

            {/* Free Products */}
            {showFreeProducts && (
              <div className="flex flex-col gap-2 p-3 bg-pink-50 dark:bg-pink-950/10 border border-pink-200 dark:border-pink-900/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-pink-700 dark:text-pink-400 text-xs">Free Product(s)</label>
                  <button type="button" onClick={addFreeProduct} className="text-[10px] font-bold text-pink-600 hover:text-pink-800 cursor-pointer">+ Add</button>
                </div>
                {form.freeProductEntries.length === 0 && (
                  <p className="text-[10px] text-pink-500">No free products configured</p>
                )}
                {form.freeProductEntries.map((fp, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={fp.productId}
                      onChange={(e) => updateFreeProduct(idx, 'productId', e.target.value)}
                      className="flex-1 h-8 px-2 border border-pink-200 rounded-lg text-xs bg-white dark:bg-zinc-800 cursor-pointer"
                    >
                      <option value="">Select product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                    <Input type="number" min="1" value={fp.quantity} onChange={(e) => updateFreeProduct(idx, 'quantity', e.target.value)} className="w-16 h-8" />
                    <button type="button" onClick={() => removeFreeProduct(idx)} className="text-pink-500 hover:text-red-500 cursor-pointer text-xs">✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Active & Stackable */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="coupon-active" checked={form.active} onChange={(e) => setForm(p => ({ ...p, active: e.target.checked }))} className="rounded border-gray-300 cursor-pointer" />
                <label htmlFor="coupon-active" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="coupon-stackable" checked={form.stackable} onChange={(e) => setForm(p => ({ ...p, stackable: e.target.checked }))} className="rounded border-gray-300 cursor-pointer" />
                <label htmlFor="coupon-stackable" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer">Stackable</label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EBEAE4] dark:border-[#2D2D2A]">
            <Button variant="outline" size="sm" onClick={() => { setIsFormOpen(false); resetForm() }} className="cursor-pointer">Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.code.trim() || !form.value || !form.expiryDate} className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer">
              {editingCoupon ? 'Save Changes' : 'Create Promotion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="size-5 text-red-500" />Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete promotion "{deleteTarget?.code}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

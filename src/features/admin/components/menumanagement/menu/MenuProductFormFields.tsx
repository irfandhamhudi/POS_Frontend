import React from 'react'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Check } from 'lucide-react'
import type { CategoryType } from 'src/features/menu/types'
import { useTranslation } from '../../../../../hooks/useTranslation'

interface MenuProductFormFieldsProps {
  idPrefix: string
  name: string
  setName: (v: string) => void
  category: CategoryType
  setCategory: (v: CategoryType) => void
  price: number
  setPrice: (v: number) => void
  stockCount: number
  setStockCount: (v: number) => void
  available: boolean
  setAvailable: (v: boolean) => void
}

export const MenuProductFormFields: React.FC<MenuProductFormFieldsProps> = ({
  idPrefix,
  name,
  setName,
  category,
  setCategory,
  price,
  setPrice,
  stockCount,
  setStockCount,
  available,
  setAvailable,
}) => {
  const { t } = useTranslation()

  const formatInputNumber = (val: number) => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const parseInputNumber = (val: string) => {
    const clean = val.replace(/\./g, '').replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Product Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-name`} className="font-semibold text-foreground">
          {t('menuManagement.addDialog.productName', 'Product Name *')}
        </Label>
        <Input
          id={`${idPrefix}-name`}
          type="text"
          placeholder="e.g. Avocado Coffee Shake"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9"
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-category`} className="font-semibold text-foreground">
          {t('menuManagement.addDialog.category', 'Category')}
        </Label>
        <select
          id={`${idPrefix}-category`}
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryType)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="coffee">{t('menuManagement.categories.coffee', 'Coffee')}</option>
          <option value="tea">{t('menuManagement.categories.tea', 'Tea')}</option>
          <option value="snack">{t('menuManagement.categories.snack', 'Snack')}</option>
          <option value="main_course">{t('menuManagement.categories.main_course', 'Main Course')}</option>
        </select>
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-price`} className="font-semibold text-foreground">
          {t('menuManagement.addDialog.price', 'Price (Rp) *')}
        </Label>
        <Input
          id={`${idPrefix}-price`}
          type="text"
          placeholder="e.g. 45.000"
          value={formatInputNumber(price)}
          onChange={(e) => setPrice(parseInputNumber(e.target.value))}
          required
          className="h-9 font-bold"
        />
      </div>

      {/* Stock Count */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-stock`} className="font-semibold text-foreground">
          {t('menuManagement.addDialog.stockCount', 'Stock Count')}
        </Label>
        <Input
          id={`${idPrefix}-stock`}
          type="number"
          value={stockCount}
          onChange={(e) => setStockCount(Number(e.target.value))}
          required
          min={0}
          className="h-9 w-full"
        />
      </div>

      {/* Available Checkbox */}
      <div
        onClick={() => setAvailable(!available)}
        className="flex items-center gap-2.5 py-1 cursor-pointer select-none group w-fit"
      >
        <div
          className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0 ${
            available
              ? 'bg-[#0A422D] border-[#0A422D] text-white scale-100 shadow-sm shadow-[#0A422D]/10'
              : 'border-border bg-background group-hover:border-[#0A422D] dark:border-border'
          }`}
        >
          {available && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
        </div>
        <span className="font-semibold text-foreground text-xs select-none">{t('menuManagement.addDialog.availableForSale', 'Available for Sale')}</span>
      </div>
    </div>
  )
}

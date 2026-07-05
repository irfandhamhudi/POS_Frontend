import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'src/components/ui/dialog'
import { Button } from 'src/components/ui/button'
import { Label } from 'src/components/ui/label'
import { MenuProductFormFields } from './MenuProductFormFields'
import { ImageUploader } from './ImageUploader'
import { IMAGE_PRESETS } from './AddMenuDialog'
import type { CategoryType } from 'src/features/menu/types'
import type { Product } from 'src/features/menu/types'

import { useTranslation } from '../../../../../hooks/useTranslation'

interface EditMenuDialogProps {
  editingProduct: Product | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitting: boolean
  name: string
  setName: (v: string) => void
  category: CategoryType
  setCategory: (v: CategoryType) => void
  price: number
  setPrice: (v: number) => void
  image: string
  setImage: (v: string) => void
  imageFile: File | null
  setImageFile: (v: File | null) => void
  stockCount: number
  setStockCount: (v: number) => void
  available: boolean
  setAvailable: (v: boolean) => void
}

export const EditMenuDialog: React.FC<EditMenuDialogProps> = ({
  editingProduct,
  onClose,
  onSubmit,
  submitting,
  name,
  setName,
  category,
  setCategory,
  price,
  setPrice,
  image,
  setImage,
  setImageFile,
  stockCount,
  setStockCount,
  available,
  setAvailable,
}) => {
  const { t } = useTranslation()

  return (
    <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="w-full sm:max-w-[850px] bg-white border border-[#EBEAE4] dark:bg-[#1C1C19] dark:border-[#2D2D2A] p-6 rounded-lg text-left shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-bold text-[#0A422D] dark:text-[#4ADE80]">
            {t('menuManagement.editDialog.title', 'Edit Menu Item')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            {t('menuManagement.editDialog.subtitle', { name: editingProduct?.name })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="py-4 text-xs flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column - Product Details */}
            <MenuProductFormFields
              idPrefix="edit"
              name={name}
              setName={setName}
              category={category}
              setCategory={setCategory}
              price={price}
              setPrice={setPrice}
              stockCount={stockCount}
              setStockCount={setStockCount}
              available={available}
              setAvailable={setAvailable}
            />

            {/* Right Column - Product Image Upload */}
            <div className="flex flex-col gap-1.5">
              <Label className="font-semibold text-foreground">{t('menuManagement.addDialog.productImage', 'Product Image')}</Label>
              <div className="mt-0.5 max-h-[285px] overflow-y-auto pr-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                <ImageUploader image={image} onChange={setImage} onFileSelect={setImageFile} presets={IMAGE_PRESETS} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting} className="cursor-pointer">
              {t('menuManagement.addDialog.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer"
              size="sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : t('menuManagement.editDialog.saveChanges', 'Save Changes')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

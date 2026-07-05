import React from 'react'
import { Card, CardContent } from 'src/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table'
import { Button } from 'src/components/ui/button'
import { Coffee, Check, X, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import { formatCurrency } from 'src/lib/utils'
import type { Product } from 'src/features/menu/types'
import { useTranslation } from '../../../../../hooks/useTranslation'

interface MenuTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string, name: string) => void
  onToggleAvailable: (product: Product) => void
}

export const MenuTable: React.FC<MenuTableProps> = ({
  products,
  onEdit,
  onDelete,
  onToggleAvailable,
}) => {
  const { t } = useTranslation()

  return (
    <Card className="shadow-sm border-border/50">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t('menuManagement.itemsTable.item', 'Item')}</TableHead>
              <TableHead>{t('menuManagement.itemsTable.productName', 'Product Name')}</TableHead>
              <TableHead>{t('menuManagement.itemsTable.category', 'Category')}</TableHead>
              <TableHead className="text-right">{t('menuManagement.itemsTable.price', 'Price')}</TableHead>
              <TableHead className="text-center">{t('menuManagement.itemsTable.stock', 'Stock')}</TableHead>
              <TableHead className="text-center">{t('menuManagement.itemsTable.status', 'Status')}</TableHead>
              <TableHead className="text-right">{t('menuManagement.itemsTable.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="size-12 rounded-lg overflow-hidden bg-muted border border-border/40 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="size-full object-cover" />
                    ) : (
                      <Coffee className="size-5 text-muted-foreground/60" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-bold text-foreground">{product.name}</div>
                  <div className="text-[10px] text-muted-foreground">ID: {product.id}</div>
                </TableCell>
                <TableCell className="capitalize text-xs font-semibold text-muted-foreground">
                  {t(`menuManagement.categories.${product.category}`, product.category.replace('_', ' '))}
                </TableCell>
                <TableCell className="text-right font-bold text-foreground">
                  {formatCurrency(product.price)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <span
                       className={`font-mono text-sm font-bold min-w-8 text-center ${product.stockCount <= 2
                        ? 'text-red-600 dark:text-red-400 font-extrabold'
                        : 'text-foreground'
                        }`}
                    >
                      {product.stockCount}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <button
                      onClick={() => onToggleAvailable(product)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${product.available && product.stockCount > 0
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                        : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-green-900/30 dark:text-red-400'
                        }`}
                    >
                      {product.available && product.stockCount > 0 ? (
                        <span className="flex items-center gap-1">
                          <Check className="size-2.5" /> {t('menuManagement.itemsTable.available', 'Available')}
                        </span>
                      ) : product.stockCount === 0 ? (
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="size-2.5" /> {t('menuManagement.itemsTable.outOfStock', 'Out of Stock')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <X className="size-2.5" /> {t('menuManagement.itemsTable.disabled', 'Disabled')}
                        </span>
                      )}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="icon-xs"
                      variant="outline"
                      onClick={() => onEdit(product)}
                      className="cursor-pointer"
                      title={t('menuManagement.itemsTable.editItem', 'Edit Item')}
                    >
                      <Edit className="size-3 text-muted-foreground hover:text-[#0A422D]" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="destructive"
                      onClick={() => onDelete(product.id, product.name)}
                      className="cursor-pointer"
                      title={t('menuManagement.itemsTable.deleteItem', 'Delete Item')}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {t('menuManagement.itemsTable.noProducts', 'No products found matching the criteria.')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

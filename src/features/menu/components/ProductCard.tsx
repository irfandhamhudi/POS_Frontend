import React from 'react';
import type { Product } from '../types';
import { Plus } from 'lucide-react';
import { useOrder } from '../../order/context/OrderContext';
import { cn, formatCurrency } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useOrder();
  const { t } = useTranslation();
  const isOutOfStock = product.stockCount <= 0;
  const isDisabled = !product.available;
  const cannotCheckout = isOutOfStock || isDisabled;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between p-4 bg-white border border-[#EBEAE4] rounded-lg transition-all duration-300",
        cannotCheckout
          ? "opacity-60"
          : "hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.06)] hover:border-[#0A422D]/30"
      )}
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full mb-3 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {!cannotCheckout && product.stockCount < 10 && (
          <div className="absolute top-2 left-2 z-10">
            <span className="dark:text-white bg-white text-black px-2.5 py-1.5 rounded text-[10px] shadow-sm tracking-wide">
              {t('pos.remainingStock', { count: product.stockCount })}
            </span>
          </div>
        )}
        {cannotCheckout && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              {isDisabled ? t('pos.unavailable', 'Unavailable') : t('pos.outOfStock', 'Out of Stock')}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col text-left">
        <h3 className="font-bold text-gray-900 text-[15px] tracking-tight group-hover:text-[#0A422D] transition-colors line-clamp-1">
          {product.name}
        </h3>

        {/* Bottom row: Price & Plus Button */}
        <div className="flex items-center justify-between mt-2.5">
          <span className="text-sm font-extrabold text-gray-700 product-price">
            {formatCurrency(product.price)}
          </span>

          <button
            onClick={() => !cannotCheckout && addToCart(product)}
            disabled={cannotCheckout}
            className={cn(
              "flex items-center justify-center size-8 rounded-full border transition-all duration-200 cursor-pointer",
              cannotCheckout
                ? "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed"
                : "border-[#0A422D]/25 text-[#0A422D] bg-white hover:bg-[#0A422D] hover:text-white hover:border-transparent active:scale-95"
            )}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

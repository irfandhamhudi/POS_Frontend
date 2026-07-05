import React from 'react';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { ShoppingBag, Lock } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  disabled?: boolean;
  disabledMessage?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, disabled, disabledMessage }) => {
  if (products.length === 0 && !disabled) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex items-center justify-center size-16 bg-[#FAF9F5] border border-[#EBEAE4] text-gray-400 rounded-2xl mb-4">
          <ShoppingBag className="size-8" />
        </div>
        <h3 className="font-bold text-gray-950 text-lg">No products found</h3>
        <p className="text-gray-500 text-sm mt-1 max-w-xs">
          We couldn't find any items matching your search or active filter.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {disabled && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg dark:bg-zinc-950/60">
          <div className=" flex items-center justify-center size-14 bg-amber-100 rounded-full mb-3">
            <Lock className="size-6 text-amber-700 dark:text-white" />
          </div>
          <p className="text-sm font-bold text-amber-800 dark:text-white text-center max-w-50">{disabledMessage}</p>
        </div>
      )}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-0.5 ${disabled ? 'pointer-events-none select-none' : ''}`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

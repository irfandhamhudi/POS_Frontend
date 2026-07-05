import React, { useState } from 'react';
import type { CartItem as CartItemType, ItemSize } from '../types';
import { Plus, Minus, FileText, Trash2, Check, ChevronDown } from 'lucide-react';
import { useOrder } from '../context/OrderContext';
import { formatCurrency } from 'src/lib/utils';

interface CartItemProps {
  item: CartItemType;
}

export const CartItem: React.FC<CartItemProps> = ({ item }) => {
  const { updateQuantity, updateItemNotes, updateItemSize, removeFromCart } = useOrder();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState(item.notes);

  const product = item.product;

  // Calculate price based on size modifier
  const getSizePriceModifier = (size: ItemSize) => {
    switch (size) {
      case 'small': return -2000;
      case 'large': return 5000;
      default: return 0;
    }
  };

  const itemUnitPrice = product.price + getSizePriceModifier(item.size);
  const itemTotalPrice = itemUnitPrice * item.quantity;

  const handleSaveNote = () => {
    updateItemNotes(product.id, item.size, tempNote);
    setIsEditingNote(false);
  };

  return (
    <div className="flex  gap-3.5 p-3.5 bg-gray-50/50 border border-[#EBEAE4] rounded-lg transition-all hover:bg-gray-50">
      {/* Product Thumbnail */}
      <div className="relative size-16 shrink-0 rounded-xl overflow-hidden bg-white border border-gray-150 flex items-center justify-center">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Item Info Column */}
      <div className="flex-1 flex flex-col justify-between min-w-0 text-left">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="font-bold text-gray-900 text-sm tracking-tight truncate">
              {product.name}
            </h4>

            {/* Sub-label: Unit Price x Qty & Size */}
            <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
              {formatCurrency(itemUnitPrice)} x {item.quantity} -
              <span className="capitalize ml-1 text-gray-500">{item.size}</span>
            </p>
          </div>

          {/* Line item total */}
          <span className="text-sm font-extrabold text-gray-900 product-price">
            {formatCurrency(itemTotalPrice)}
          </span>
        </div>

        {/* Note / Size / Actions Row */}
        <div className="flex items-center justify-between mt-2.5 gap-2">
          {/* Note Controls */}
          <div className="relative flex-1">
            {isEditingNote ? (
              <div className="flex items-center gap-1 w-full bg-white border border-[#EBEAE4] rounded px-2 py-0.5 shadow-sm">
                <input
                  type="text"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNote()}
                  placeholder="Note..."
                  className="w-full text-xs font-semibold text-gray-700 bg-transparent border-none outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveNote}
                  className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  <Check className="size-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setTempNote(item.notes);
                    setIsEditingNote(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-150 hover:bg-gray-50 rounded text-[10px] font-bold text-gray-500 cursor-pointer"
                >
                  <FileText className="size-3" />
                  <span>{item.notes || 'Add note'}</span>
                </button>

                {/* Inline Size Picker */}
                <div className="relative">
                  <select
                    value={item.size}
                    onChange={(e) => updateItemSize(product.id, item.size, e.target.value as ItemSize)}
                    className="bg-white border border-gray-150 rounded text-[10px] font-bold text-gray-500 py-0.5 pl-1.5 pr-5 cursor-pointer outline-none hover:bg-gray-50 appearance-none"
                  >
                    <option className="cursor-pointer" value="small">S</option>
                    <option className="cursor-pointer" value="medium">M</option>
                    <option className="cursor-pointer" value="large">L</option>
                  </select>
                  <ChevronDown className="absolute right-1.5 top-3.5 -translate-y-1/2 size-2.5 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Quantity Controls & Delete */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-[#EBEAE4] rounded h-7">
              <button
                onClick={() => updateQuantity(product.id, item.size, -1)}
                className="flex items-center justify-center w-7 h-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-gray-800">
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(product.id, item.size, 1)}
                className="flex items-center justify-center w-7 h-full text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <Plus className="size-3" />
              </button>
            </div>

            <button
              onClick={() => removeFromCart(product.id, item.size)}
              className="flex items-center justify-center size-7 text-gray-400 hover:text-red-500 bg-white border border-gray-150 hover:border-red-100 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

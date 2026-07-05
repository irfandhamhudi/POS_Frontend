import React from 'react';
import { useOrder } from '../context/OrderContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShoppingCart, Trash2, Clock, ShoppingBag } from 'lucide-react';
import { cn, formatCurrency } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';

interface HeldOrdersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HeldOrdersModal: React.FC<HeldOrdersModalProps> = ({ open, onOpenChange }) => {
  const { heldOrders, recallHeldOrder, deleteHeldOrder } = useOrder();
  const { t, i18n } = useTranslation();

  const dialogMaxwidth = i18n.language === 'id' ? 'sm:max-w-xl' : 'sm:max-w-lg';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogMaxwidth} bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-xl p-6 text-left shadow-xl max-h-[85vh] overflow-y-auto custom-scrollbar`}>
        <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
          <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none flex items-center gap-2">
            <Clock className="size-5" />
            {t('pos.heldOrders.title', 'Held Orders List')}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium text-xs mt-1 block">
            {t('pos.heldOrders.subtitle', 'Revert to draft or cancel saved pending orders.')}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-4">
          {heldOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center bg-[#FAF9F5] dark:bg-[#232320] border border-dashed border-[#EBEAE4] dark:border-[#2D2D2A] rounded-xl">
              <div className="flex items-center justify-center size-12 bg-gray-50 dark:bg-neutral-800/40 text-gray-450 dark:text-gray-550 border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-xl mb-3">
                <ShoppingBag className="size-5.5" />
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-gray-100">{t('pos.heldOrders.emptyTitle', 'No orders on hold')}</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
                {t('pos.heldOrders.emptyDesc', 'You can place an active order on hold from the sidebar checkout screen.')}
              </p>
            </div>
          ) : (
            heldOrders.map((order) => {
              // Get initials for initials avatar badge
              const initials = order.customerName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div
                  key={order.id}
                  className="flex flex-col p-5 bg-[#FAF9F5] dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg shadow-sm hover:shadow hover:border-gray-300 dark:hover:border-[#3a3a37] transition-all duration-200 gap-4"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {/* Initials Avatar */}
                      <div className="flex items-center justify-center size-10 rounded-full bg-[#0A422D]/10 text-[#0A422D] dark:bg-[#4ADE80]/15 dark:text-[#4ADE80] font-black text-sm select-none shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col text-left min-w-0">
                        <span className="text-sm font-black text-gray-900 dark:text-gray-100 truncate leading-snug">
                          {order.customerName}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide uppercase border",
                            order.orderType === 'dine_in'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-150 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
                              : "bg-blue-50 text-blue-700 border-blue-150 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-900/30"
                          )}>
                            {order.orderType === 'dine_in' ? t('pos.dineIn', 'Dine In') : t('pos.takeAway', 'Take Away')}
                          </span>
                          {order.tableNumber !== 'N/A' && (
                            <span className="text-[10px] text-gray-450 dark:text-gray-500 font-bold">
                              {t('pos.heldOrders.table', { number: order.tableNumber })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-gray-400 dark:text-gray-550 font-bold uppercase tracking-wider">{t('pos.heldOrders.total', 'Total')}</span>
                      <span className="text-base font-black text-[#0A422D] dark:text-[#4ADE80] leading-none mt-0.5">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Body: Products Tag List */}
                  <div className="flex flex-wrap gap-2">
                    {order.cart.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white dark:bg-[#1a1a17] p-1.5 pr-2.5 rounded border border-[#EBEAE4]/80 dark:border-[#2D2D2A] text-xs font-bold text-gray-700 dark:text-gray-300 shadow"
                      >
                        {item.product.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-8 h-8 object-cover rounded-md border border-gray-100 dark:border-[#2D2D2A]/80 shrink-0"
                          />
                        )}
                        <div className="flex flex-col text-left min-w-0">
                          <span className="leading-tight text-gray-900 dark:text-gray-200">
                            {item.product.name}
                          </span>
                          <span className="text-[9px] text-gray-400 dark:text-gray-550 font-bold mt-0.5">
                            x{item.quantity} - {item.size}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer: Details & Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-[#EBEAE4]/80 dark:border-[#2D2D2A]/80">
                    <span className="text-[10px] text-gray-400 dark:text-gray-550 font-bold flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {t('pos.heldOrders.heldTime', { time: order.timestamp })}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm(t('pos.heldOrders.cancelConfirm', { name: order.customerName }))) {
                            deleteHeldOrder(order.id);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200/50 text-red-600 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={t('pos.heldOrders.cancelBtn', 'Cancel Order')}
                      >
                        <Trash2 className="size-3.5" />
                        {t('pos.heldOrders.cancelBtn', 'Cancel Order')}
                      </button>
                      <button
                        onClick={() => {
                          recallHeldOrder(order.id);
                          onOpenChange(false);
                        }}
                        className="px-3 py-1.5 bg-[#0A422D] hover:bg-[#0A422D]/90 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
                      >
                        <ShoppingCart className="size-3.5" />
                        {t('pos.heldOrders.revertBtn', 'Revert to Draft')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

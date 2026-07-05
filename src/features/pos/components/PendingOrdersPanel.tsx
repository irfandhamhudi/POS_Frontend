import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { ShoppingBag, CheckCircle2, Clock, User, ReceiptText, Banknote, Armchair } from 'lucide-react';
import { useOrder } from 'src/features/order/context/OrderContext';
import { useTranslation } from 'src/hooks/useTranslation';
import { formatCurrency } from 'src/lib/utils';

interface PendingOrdersPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PendingOrdersPanel: React.FC<PendingOrdersPanelProps> = ({ isOpen, onClose }) => {
  const { pendingTransactions, approvePayment } = useOrder();
  const { t, currentLanguage } = useTranslation();
  const isId = currentLanguage === 'id';

  const handleApprove = async (txId: string) => {
    await approvePayment(txId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-md p-0 text-left shadow-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <DialogTitle className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            {t('pos.pendingOrders', 'Pending Orders')}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
            {pendingTransactions.length > 0
              ? (isId
                ? `Ada ${pendingTransactions.length} pesanan menunggu persetujuan pembayaran`
                : `${pendingTransactions.length} order(s) awaiting payment approval`)
              : (isId ? 'Tidak ada pesanan tertunda' : 'No pending orders')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
          {pendingTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <ShoppingBag className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-xs font-medium">
                {isId ? 'Semua pesanan sudah diproses' : 'All orders have been processed'}
              </p>
            </div>
          ) : (
            pendingTransactions.map((tx) => (
              <div
                key={tx._id || tx.id}
                className="flex flex-col gap-3 p-4 rounded-md border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400 truncate">{tx.id}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {tx.customerName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Armchair  className="h-3 w-3" />
                        {tx.tableNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        {tx.paymentMethod?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm text-zinc-900 dark:text-white">{formatCurrency(tx.total)}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase">{isId ? 'Menunggu' : 'Pending'}</p>
                  </div>
                </div>

                {tx.items && tx.items.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto no-scrollbar pr-1">
                    {tx.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {item.product?.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-md object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center">
                            <ShoppingBag className="h-3.5 w-3.5 text-zinc-400" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-zinc-900 dark:text-white truncate leading-tight">
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-medium mt-0.5 capitalize">
                            {item.size === 'small' ? (isId ? 'kecil' : 'Small') : item.size === 'medium' ? (isId ? 'sedang' : 'Medium') : (isId ? 'besar' : 'Large')}
                          </span>
                          {item.notes && (
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                              {isId ? 'Catatan' : 'Note'}: {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => tx._id && handleApprove(tx._id)}
                  className="w-full h-9 bg-[#0A422D] hover:bg-[#0A422D]/90 text-white font-black text-xs rounded-md flex items-center justify-center gap-2 cursor-pointer mt-1 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isId ? 'Setujui Pembayaran' : 'Approve Payment'}
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-10 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-md"
          >
            {isId ? 'Tutup' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

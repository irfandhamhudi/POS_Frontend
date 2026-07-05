import React from 'react';
import { cn } from 'src/lib/utils';
import type { POSNotification } from '../../order/context/OrderContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useOrder } from '../../order/context/OrderContext';
import { formatCurrency } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';


interface OrderDetailModalProps {
  selectedNotif: POSNotification | null;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  selectedNotif,
  onClose,
}) => {
  const { transactions } = useOrder();
  const { t, i18n } = useTranslation();

  const tx = transactions.find((t) => t.id === selectedNotif?.receiptNumber);
  const isCancelled = tx?.status === 'cancelled' || selectedNotif?.type === 'cancel';
  /*
  const handlePrint = () => {
    if (!selectedNotif) return;
    const subtotalVal = selectedNotif.items?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0;
    const taxVal = subtotalVal * 0.1;
    const totalVal = subtotalVal * 1.1;
    const formattedDate = selectedNotif.date || selectedNotif.time;

    const winPrint = window.open('', '', 'left=0,top=0,width=400,height=600,toolbar=0,scrollbars=0,status=0');
    if (!winPrint) return;
    winPrint.document.write(`
      <html>
        <head>
          <title>Receipt ${selectedNotif.receiptNumber || 'N/A'}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Space Mono', monospace, Courier, monospace;
              font-size: 11px;
              line-height: 1.4;
              padding: 15px;
              margin: 0;
              width: 72mm;
              background-color: #fff;
              color: #000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .my-1 { margin-top: 4px; margin-bottom: 4px; }
            .my-1.5 { margin-top: 6px; margin-bottom: 6px; }
            .my-2.5 { margin-top: 10px; margin-bottom: 10px; }
            .mt-0.5 { margin-top: 2px; }
            .mt-1 { margin-top: 4px; }
            .pt-1.5 { padding-top: 6px; }
            .border-t { border-top: 1px dashed #000; }
            .border-b { border-bottom: 1px dashed #000; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .flex-col { flex-direction: column; }
            .gap-1.5 { gap: 6px; }
            .gap-2 { gap: 8px; }
            .items-start { align-items: flex-start; }
            .shrink-0 { flex-shrink: 0; }
            .text-xs { font-size: 12px; }
            .text-neutral-500 { color: #666; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .tracking-widest { letter-spacing: 0.1em; }
            .leading-tight { line-height: 1.25; }
            .truncate {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .max-w-[120px] { max-w: 120px; }
          </style>
        </head>
        <body>
          <div class="text-center font-bold text-xs mb-1 uppercase tracking-wider">Antigravity POS</div>
          <div class="text-center text-neutral-500 mb-2 leading-tight" style="font-size: 9px;">
            123 Green Street, Food Court<br />
            Tel: +62 812-3456-7890
          </div>

          <div class="border-b my-1.5"></div>

          <div class="flex justify-between">
            <span>Receipt:</span>
            <span class="font-bold">\${selectedNotif.receiptNumber || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span>Customer:</span>
            <span class="font-bold truncate max-w-[120px]">\${selectedNotif.title}</span>
          </div>
          <div class="flex justify-between">
            <span>Type:</span>
            <span class="font-bold capitalize">\${selectedNotif.orderType?.replace('_', ' ') || 'N/A'}</span>
          </div>
          <div class="flex justify-between">
            <span>Date:</span>
            <span class="font-bold">\${formattedDate}</span>
          </div>

          <div class="border-b my-1.5"></div>

          <!-- Items -->
          <div class="flex flex-col gap-1.5 my-1">
            \${selectedNotif.items?.map(item => `
              <div class="flex justify-between items-start gap-2">
                <div class="flex flex-col">
                  <span class="font-bold">\${item.name}</span>
                  <span class="text-neutral-500" style="font-size: 9px;">\${item.quantity} x \$\${item.price.toFixed(2)}</span>
                </div>
                <span class="font-bold shrink-0">\$\${(item.quantity * item.price).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="border-b my-1.5"></div>

          <!-- Totals -->
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>\$\${subtotalVal.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span>Tax (10%):</span>
            <span>\$\${taxVal.toFixed(2)}</span>
          </div>
          <div class="flex justify-between font-bold text-xs mt-1 border-t pt-1.5">
            <span>TOTAL:</span>
            <span>\$\${totalVal.toFixed(2)}</span>
          </div>

          \${tx ? `
            <div class="flex justify-between mt-1 border-t pt-1.5">
              <span>Payment Method:</span>
              <span class="font-bold capitalize">\${tx.paymentMethod || 'cash'}</span>
            </div>
            \${tx.paymentMethod === 'cash' ? `
              <div class="flex justify-between">
                <span>Cash Received:</span>
                <span>\$\$\${(tx.amountPaid ?? totalVal).toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span>Change:</span>
                <span>\$\$\${(tx.change ?? 0).toFixed(2)}</span>
              </div>
            ` : ''}
          ` : ''}

          <div class="border-b my-2.5"></div>

          <div class="text-center text-neutral-500 uppercase tracking-widest mt-0.5" style="font-size: 9px;">
            *** Thank You ***
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    \`);
    winPrint.document.close();
    winPrint.focus();
  };
  */


  const subtotal = selectedNotif?.items?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0;
  const tax = subtotal * 0.1;
  const total = subtotal * 1.1;

  return (
    <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6 text-left shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
          <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none">{t('pos.orderDetail')}</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium text-xs mt-1 block">
            {t('pos.orderDetailDesc', { customer: selectedNotif?.title })}
          </DialogDescription>
        </DialogHeader>

        {selectedNotif && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4">
            {/* Left Column: Details & Items (7 Cols) */}
            <div className="md:col-span-7 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 bg-[#FAF9F5] dark:bg-[#232320] p-4 rounded-lg border border-[#EBEAE4]/60 dark:border-[#2D2D2A]">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('adminDashboard.customer', 'Customer')}</span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-gray-105 mt-0.5">{selectedNotif.title}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('pos.dateAndTime')}</span>
                  <span className="text-sm font-extrabold text-gray-955 dark:text-gray-55 mt-0.5">{selectedNotif.date || selectedNotif.time}</span>
                </div>
                <div className="flex flex-col text-left border-t border-[#EBEAE4]/40 dark:border-[#2D2D2A]/40 pt-3">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('pos.purchaseReceipt')}</span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-gray-105 mt-0.5">
                    {selectedNotif.receiptNumber ? `${selectedNotif.receiptNumber}` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col text-right border-t border-[#EBEAE4]/40 dark:border-[#2D2D2A]/40 pt-3">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('pos.orderType')}</span>
                  <span className="text-sm font-extrabold text-gray-900 dark:text-gray-105 mt-0.5 capitalize">
                    {selectedNotif.orderType === 'dine_in' ? t('pos.dineIn') : selectedNotif.orderType === 'take_away' ? t('pos.takeAway') : selectedNotif.orderType === 'order_online' ? t('pos.orderOnline') : selectedNotif.orderType || 'N/A'}
                  </span>
                </div>
                {tx && (
                  <>
                    <div className="flex flex-col text-left border-t border-[#EBEAE4]/40 dark:border-[#2D2D2A]/40 pt-3">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('orderManagement.invoiceDialog.paymentMethodLabel', 'Payment Method').replace(':', '')}</span>
                      <span className="text-sm font-extrabold text-gray-900 dark:text-gray-105 mt-0.5 capitalize">
                        {tx.paymentMethod === 'cash' ? (i18n.language === 'id' ? 'Tunai' : 'Cash') : tx.paymentMethod?.toUpperCase() || 'Cash'}
                      </span>
                    </div>
                    <div className="flex flex-col text-right border-t border-[#EBEAE4]/40 dark:border-[#2D2D2A]/40 pt-3">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('pos.orderStatus')}</span>
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded inline-block self-end mt-0.5",
                        tx.status === 'cancelled'
                          ? "bg-red-50 text-red-600 dark:text-red-400 border border-red-150"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-150"
                      )}>
                        {tx.status === 'cancelled' ? t('pos.cancelStatus') : t('pos.completedStatus')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{t('pos.itemsOrdered')}</span>
                <div className={cn(
                  "flex flex-col gap-2.5 max-h-45 overflow-y-auto custom-scrollbar",
                  (selectedNotif.items?.length || 0) > 3 ? "px-0" : "px-2"
                )}>
                  {selectedNotif.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-[#262623] border border-[#EBEAE4]/80 dark:border-[#2D2D2A] rounded-lg shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-gray-150 dark:border-[#2D2D2A]" />
                        )}
                        <div className="flex flex-col min-w-0 text-left">
                          <span className="text-xs font-bold text-gray-955 dark:text-gray-55 truncate">{item.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold mt-0.5">{item.quantity} x {formatCurrency(item.price)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-gray-900 dark:text-gray-100">{formatCurrency(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#EBEAE4] dark:border-[#2D2D2A] pt-4 flex flex-col gap-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-gray-500">{t('pos.subtotal')}</span>
                  <span className="font-extrabold text-gray-955 dark:text-gray-55">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 dark:text-gray-500">{t('pos.tax')}</span>
                  <span className="font-extrabold text-gray-955 dark:text-gray-55">
                    {formatCurrency(tax)}
                  </span>
                </div>
                <div className="border-t border-[#EBEAE4] dark:border-[#2D2D2A] pt-2.5 flex justify-between items-center text-sm">
                  <span className="text-gray-955 dark:text-gray-55 font-black">{t('orderManagement.invoiceDialog.totalAmountLabel', 'Total Amount')}</span>
                  <span className="font-black text-[#0A422D] dark:text-[#4ADE80] text-base">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Receipt Preview (5 Cols) */}
            <div className="md:col-span-5 flex flex-col gap-3">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-left">{t('pos.receiptPreview')}</span>

              {/* Thermal Receipt Paper representation */}
              <div
                id="receipt-print-area"
                className="relative bg-white! text-black! border border-dashed border-neutral-300! p-5 rounded-lg font-['Space_Mono'] text-[10px] shadow-sm flex flex-col text-left select-none overflow-hidden"
              >
                {isCancelled && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center pointer-events-none select-none z-10">
                    <div className="border-4 border-red-600 text-red-600 font-black text-xl uppercase tracking-widest px-4 py-2 rotate-12 rounded opacity-80">
                      {t('pos.cancelStatus')}
                    </div>
                  </div>
                )}
                <div className="text-center font-bold text-xs mb-1 uppercase tracking-wider">GREEN GROUNDS COFFEE</div>
                <div className="text-center text-[8px] text-neutral-500 mb-2 leading-tight">
                  123 Green Street, Food Court<br />
                  Tel: +62 812-3456-7890
                </div>

                <div className="border-b border-dashed border-neutral-300 my-1.5" />

                <div className="flex justify-between">
                  <span>{t('pos.receiptNo')}:</span>
                  <span className="font-bold">{selectedNotif.receiptNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('adminDashboard.customer', 'Customer')}:</span>
                  <span className="font-bold truncate max-w-30">{selectedNotif.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('pos.orderType')}:</span>
                  <span className="font-bold capitalize">
                    {selectedNotif.orderType === 'dine_in' ? t('pos.dineIn') : selectedNotif.orderType === 'take_away' ? t('pos.takeAway') : selectedNotif.orderType === 'order_online' ? t('pos.orderOnline') : selectedNotif.orderType || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{i18n.language === 'id' ? 'Tanggal:' : 'Date:'}</span>
                  <span className="font-bold">{selectedNotif.date || selectedNotif.time}</span>
                </div>

                <div className="border-b border-dashed border-neutral-300 my-1.5" />

                {/* Items */}
                <div className="flex flex-col gap-1.5 my-1">
                  {selectedNotif.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="font-bold">{item.name}</span>
                        <span className="text-[9px] text-neutral-500">{item.quantity} x {formatCurrency(item.price)}</span>
                      </div>
                      <span className="font-bold shrink-0">{formatCurrency(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-b border-dashed border-neutral-300 my-1.5" />

                {/* Totals */}
                <div className="flex justify-between">
                  <span>{t('pos.subtotal')}:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('pos.tax')}:</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-xs mt-1 border-t border-dashed border-neutral-300 pt-1.5">
                  <span>{t('pos.total').toUpperCase()}:</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                {tx && (
                  <>
                    <div className="flex justify-between mt-1 border-t border-dashed border-neutral-300 pt-1.5">
                      <span>{t('orderManagement.invoiceDialog.paymentMethodLabel', 'Payment Method:')}</span>
                      <span className="font-bold capitalize">
                        {tx.paymentMethod === 'cash' ? (i18n.language === 'id' ? 'Tunai' : 'Cash') : tx.paymentMethod?.toUpperCase() || 'Cash'}
                      </span>
                    </div>
                    {tx.paymentMethod === 'cash' && (
                      <>
                        <div className="flex justify-between">
                          <span>{t('pos.cashReceived')}:</span>
                          <span>{formatCurrency(tx.amountPaid ?? total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('pos.changeDue')}:</span>
                          <span>{formatCurrency(tx.change ?? 0)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="border-b border-dashed border-neutral-300 my-2.5" />

                <div className="text-center text-[8px] text-neutral-500 uppercase tracking-widest mt-0.5">
                  *** {i18n.language === 'id' ? 'Terima Kasih' : 'Thank You'} ***
                </div>
              </div>

              {/* Print Receipt Action Button */}
              {/*
              <button
                type="button"
                onClick={handlePrint}
                className="w-full h-11 bg-[#0A422D] hover:bg-[#0A422D]/90 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-sm mt-1"
              >
                <Printer className="size-4" />
                Print Receipt
              </button>
              */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

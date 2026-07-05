import React, { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CreditCard, Banknote, CheckCircle, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from 'src/lib/utils';
import { toast } from 'src/hooks/use-toast';
import { useTranslation } from '../../../hooks/useTranslation';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ open, onOpenChange, total }) => {
  const { placeOrder, receiptNumber, customerName } = useOrder();
  const { t } = useTranslation();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentState, setPaymentState] = useState<'input' | 'processing' | 'success'>('input');
  const [paidCustomerName, setPaidCustomerName] = useState('');

  const numericAmountPaid = Number(amountPaid) || 0;
  const change = Math.max(0, numericAmountPaid - total);
  const isAmountSufficient = numericAmountPaid >= total;

  useEffect(() => {
    if (open) {
      setPaymentMethod('cash');
      setAmountPaid('');
      setPaymentState('input');
    }
  }, [open]);

  const handleQuickCash = (amount: number) => {
    setAmountPaid(amount.toString());
  };

  const getQuickCashSuggestions = () => {
    const suggestions = new Set<number>();
    suggestions.add(total);
    const ceilTotal = Math.ceil(total);
    [5000, 10000, 20000, 50000, 100000].forEach((val) => {
      const option = Math.ceil(ceilTotal / val) * val;
      if (option >= total && option <= total + 100000) {
        suggestions.add(option);
      }
    });
    return Array.from(suggestions).sort((a, b) => a - b).slice(0, 4);
  };

  const handlePay = () => {
    if (!isAmountSufficient) {
      toast({
        title: t('pos.insufficientCash'),
        description: t('notifications.cashReceivedAlert', 'Cash received must be equal to or greater than the total amount.'),
        variant: 'error',
      });
      return;
    }

    setPaymentState('processing');
    setPaidCustomerName(customerName);

    setTimeout(async () => {
      const success = await placeOrder(paymentMethod, numericAmountPaid, change);
      if (success) {
        setPaymentState('success');
      } else {
        setPaymentState('input');
        toast({
          title: t('pos.error', 'Error'),
          description: t('notifications.placeOrderError', 'Failed to place order. Please try again.'),
          variant: 'error',
        });
      }
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => paymentState !== 'processing' && onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6 text-left shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        {paymentState !== 'success' && (
          <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
            <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none">
              {t('pos.checkoutPayment')}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium text-xs mt-1 block">
              {t('pos.receiptNo')} {receiptNumber} {customerName ? `for ${customerName}` : ''}
            </DialogDescription>
          </DialogHeader>
        )}

        {paymentState === 'input' && (
          <div className="mt-4 flex flex-col gap-5">
            {/* Total Display */}
            <div className="bg-[#FAF9F5] dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] p-4 rounded-xl flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-left">{t('pos.totalBill')}</span>
              <span className="text-2xl font-black text-[#0A422D] dark:text-[#4ADE80]">{formatCurrency(total)}</span>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-left">{t('pos.paymentMethod')}</span>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Cash */}
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold gap-1.5 transition-all cursor-pointer",
                    paymentMethod === 'cash'
                      ? "border-[#0A422D] bg-[#0A422D]/5 text-[#0A422D] dark:border-[#4ADE80] dark:bg-[#4ADE80]/5 dark:text-[#4ADE80]"
                      : "border-[#EBEAE4] dark:border-[#2D2D2A] hover:bg-gray-50 dark:hover:bg-[#262623] text-gray-650 dark:text-gray-400"
                  )}
                >
                  <Banknote className="size-5" />
                  {t('pos.cash', 'Cash')}
                </button>

                {/* QRIS */}
                <button
                  onClick={() => setPaymentMethod('qris')}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold gap-1.5 transition-all cursor-pointer",
                    paymentMethod === 'qris'
                      ? "border-[#0A422D] bg-[#0A422D]/5 text-[#0A422D] dark:border-[#4ADE80] dark:bg-[#4ADE80]/5 dark:text-[#4ADE80]"
                      : "border-[#EBEAE4] dark:border-[#2D2D2A] hover:bg-gray-50 dark:hover:bg-[#262623] text-gray-650 dark:text-gray-400"
                  )}
                >
                  <Banknote className="size-5" />
                  QRIS
                </button>
              </div>
            </div>

            {/* Payment Details Form */}
            <div className="border-t border-[#EBEAE4] dark:border-[#2D2D2A] pt-4 flex flex-col gap-4">
              {(paymentMethod === 'cash' || paymentMethod === 'qris') && (
                <div className="flex flex-col gap-3.5 text-left">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-left">{t('pos.cashReceived')}</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Rp</span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={amountPaid}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') { setAmountPaid(''); return; }
                          const num = Number(val);
                          if (isNaN(num) || num < 0) { setAmountPaid('0'); } else { setAmountPaid(val); }
                        }}
                        placeholder={t('pos.enterName')}
                        className="w-full h-11 pl-10 pr-3 bg-white dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg text-sm font-extrabold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0A422D] dark:focus:border-[#4ADE80]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-left">{t('pos.quickCash')}</span>
                    <div className="flex flex-wrap gap-2">
                      {getQuickCashSuggestions().map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickCash(amt)}
                          className={cn(
                            "px-3 py-1.5 border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg text-xs font-bold transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-[#262623]",
                            numericAmountPaid === amt && "bg-[#0A422D] border-[#0A422D] text-white hover:bg-[#0A422D] dark:bg-[#4ADE80] dark:border-[#4ADE80] dark:text-[#1C1C19]"
                          )}
                        >
                          {formatCurrency(amt)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 mt-1 bg-[#FAF9F5] dark:bg-[#232320] p-3 rounded-lg border border-[#EBEAE4]/60 dark:border-[#2D2D2A]">
                    <div className="flex flex-col text-left">
                      <span className="text-[9px] text-gray-455 uppercase font-bold tracking-wider">{t('pos.changeDue')}</span>
                      <span className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] mt-0.5">
                        {formatCurrency(change)}
                      </span>
                    </div>
                    <div className="flex flex-col text-right justify-center">
                      {!amountPaid ? (
                        <span className="text-[10px] text-gray-400 font-bold">{t('pos.waitingInput')}</span>
                      ) : !isAmountSufficient ? (
                        <span className="text-[10px] text-red-500 font-black uppercase">{t('pos.insufficientCash')}</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-black uppercase">{t('pos.amountOk')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handlePay}
              disabled={!isAmountSufficient}
              className={cn(
                "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md select-none transition-all active:scale-[0.98] mt-2",
                !isAmountSufficient
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none"
                  : "bg-[#0A422D] hover:bg-[#0A422D]/95 text-white"
              )}
            >
              {t('pos.confirmPayBtn')}
            </button>
          </div>
        )}

        {paymentState === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
            <Loader2 className="size-10 text-[#0A422D] dark:text-[#4ADE80] animate-spin" />
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-extrabold text-gray-900 dark:text-gray-100">{t('pos.processingPayment')}</h3>
              <p className="text-xs text-gray-400 font-medium">{t('pos.processingPaymentDesc')}</p>
            </div>
          </div>
        )}

        {paymentState === 'success' && (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-5">
            <div className="text-emerald-600 dark:text-emerald-500 animate-bounce">
              <CheckCircle className="size-14 fill-emerald-50 dark:fill-emerald-950/20" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-black text-gray-955 dark:text-white tracking-tight">{t('pos.paymentSuccess')}</h2>
              <p className="text-xs text-gray-400 font-medium">{t('pos.paymentSuccessDesc')}</p>
            </div>

            <div className="w-full bg-[#FAF9F5] dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] p-4 rounded-xl text-xs flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-semibold">{t('pos.receiptNo')}</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100">{receiptNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-semibold">{t('pos.customer')}</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100">{paidCustomerName || 'Walk-in Customer'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-semibold">{t('pos.paymentMethod')}</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100 capitalize">{paymentMethod === 'qris' ? 'QRIS' : t('pos.cash', 'Cash')}</span>
              </div>
              <div className="border-t border-[#EBEAE4] dark:border-[#2D2D2A] my-1" />
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-800 dark:text-gray-200">{t('pos.amountPaid')}</span>
                <span className="text-gray-900 dark:text-white">{formatCurrency(numericAmountPaid)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-500 font-bold">
                <span>{t('pos.changeGiven')}</span>
                <span>{formatCurrency(change)}</span>
              </div>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full h-11 bg-[#0A422D] hover:bg-[#0A422D]/90 text-white rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {t('pos.doneCloseBtn')}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

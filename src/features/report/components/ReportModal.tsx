import React, { useState, useEffect } from 'react';
import { useOrder, type POSNotification } from '../../order/context/OrderContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { TrendingUp, FileSpreadsheet, Layers, ShoppingBag } from 'lucide-react';
import { ExportExcelButton } from './ExportExcelButton';
import { OrderDetailModal } from '../../pos/components/OrderDetailModal';
import { cn, formatCurrency } from 'src/lib/utils';
import type { Transaction } from '../../order/types';
import { useTranslation } from '../../../hooks/useTranslation';
import api from 'src/api';

interface CashoutData {
  amount: number;
  description: string;
  createdAt: string;
}

export const ReportModal: React.FC = () => {
  const { transactions, isReportOpen, setIsReportOpen } = useOrder();
  const [selectedNotif, setSelectedNotif] = useState<POSNotification | null>(null);
  const [cashouts, setCashouts] = useState<CashoutData[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isReportOpen) return;
    api.get('/shifts/cashouts/today').then(res => {
      if (res.data.success) setCashouts(res.data.data);
    }).catch(() => {});
  }, [isReportOpen]);

  const handleTransactionClick = (tx: Transaction) => {
    const notif: POSNotification = {
      id: tx.id,
      title: tx.customerName,
      message: `Ordered ${tx.items.reduce((sum, item) => sum + item.quantity, 0)} meals.`,
      time: tx.timestamp,
      type: tx.status === 'cancelled' ? 'cancel' : 'order',
      read: true,
      date: tx.timestamp,
      receiptNumber: tx.id,
      orderType: tx.orderType,
      items: tx.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.image
      }))
    };
    setSelectedNotif(notif);
  };

  // Calculations
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalOrders = transactions.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate itemized popularity sales
  const itemPopularity: { [key: string]: { name: string; category: string; qty: number; revenue: number } } = {};

  transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      const id = item.product.id;
      const sizePriceModifier = item.size === 'small' ? -2000 : item.size === 'large' ? 5000 : 0;
      const unitPrice = item.product.price + sizePriceModifier;

      if (itemPopularity[id]) {
        itemPopularity[id].qty += item.quantity;
        itemPopularity[id].revenue += unitPrice * item.quantity;
      } else {
        itemPopularity[id] = {
          name: item.product.name,
          category: item.product.category,
          qty: item.quantity,
          revenue: unitPrice * item.quantity,
        };
      }
    });
  });

  const popularItems = Object.values(itemPopularity).sort((a, b) => b.qty - a.qty);

  return (
    <>
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent showCloseButton={false} className="min-w-[70%] max-w-[70%] max-h-[90vh] overflow-y-auto bg-white border border-[#EBEAE4] rounded-lg p-6 shadow-xl">
          <DialogHeader className="text-left border-b border-[#EBEAE4] pb-4 flex flex-row justify-between items-start">
            <div className="flex flex-col">
              <DialogTitle className="text-xl font-extrabold text-[#0A422D] flex items-center gap-2">
                <FileSpreadsheet className="size-5" />
                {t('reportManagement.title')}
              </DialogTitle>
              <DialogDescription className="text-gray-500 font-medium text-xs mt-1">
                {t('reportManagement.subtitle')}
              </DialogDescription>
            </div>
            <ExportExcelButton transactions={transactions} popularItems={popularItems} cashouts={cashouts} />
          </DialogHeader>

          {/* Dashboard Cards Row */}
          <div className="grid grid-cols-3 gap-4 mt-5">
            {/* Card 1: Revenue */}
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 text-left flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-wider">{t('reportManagement.totalRevenue')}</span>
                <span className="text-2xl font-black text-[#0A422D] mt-1.5">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="p-2 bg-emerald-100 rounded-xl text-emerald-800">
                <TrendingUp className="size-4.5" />
              </div>
            </div>

            {/* Card 2: Total Orders */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-left flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('reportManagement.completedOrders')}</span>
                <span className="text-2xl font-black text-gray-900 mt-1.5">{totalOrders}</span>
              </div>
              <div className="p-2 bg-gray-150 rounded-xl text-gray-700">
                <ShoppingBag className="size-4.5" />
              </div>
            </div>

            {/* Card 3: Avg Order Value */}
            <div className="bg-amber-50/40 border border-amber-100/70 rounded-lg p-4 text-left flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-amber-800/80 uppercase tracking-wider">{t('reportManagement.averageOrderValue')}</span>
                <span className="text-2xl font-black text-amber-900 mt-1.5">{formatCurrency(averageOrderValue)}</span>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg text-amber-800">
                <Layers className="size-4.5" />
              </div>
            </div>
          </div>

          {/* Report Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
            {/* Left Side: Recent Transactions (3/5 width) */}
            <div className="md:col-span-3 flex flex-col gap-3.5 text-left">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t('adminDashboard.recentTransactions')}
              </h3>

              {transactions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <span className="text-gray-400 text-xs font-semibold">{t('pos.noTransactionsYet')}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto border border-[#0A422D]/25 rounded-lg p-3 bg-white custom-scrollbar shadow-sm">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => handleTransactionClick(tx)}
                      className={cn(
                        "flex justify-between items-center p-3 bg-white border rounded-lg hover:border-gray-300 transition-all text-xs cursor-pointer select-none",
                        tx.status === 'cancelled'
                          ? "border-red-105 bg-red-50/10 text-gray-400"
                          : "border-[#EBEAE4] hover:bg-gray-50/30"
                      )}
                    >
                      <div className="flex flex-col text-left">
                        <span className={cn(
                          "font-extrabold",
                          tx.status === 'cancelled' ? "line-through text-gray-400" : "text-gray-950"
                        )}>
                          Receipt {tx.id}
                        </span>
                        <span className="text-[10px] text-gray-500 font-semibold mt-0.5">
                          {tx.customerName} - {tx.timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {tx.status === 'cancelled' ? (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-bold uppercase tracking-wider border border-red-150">
                            {t('pos.cancelStatus')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold uppercase tracking-wider">
                            {tx.orderType === 'dine_in' ? t('pos.dineIn') : tx.orderType === 'take_away' ? t('pos.takeAway') : tx.orderType}
                          </span>
                        )}
                        <span className={cn(
                          "font-bold text-sm",
                          tx.status === 'cancelled' ? "text-gray-405 line-through" : "text-[#0A422D]"
                        )}>
                          {formatCurrency(tx.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Popular Items (2/5 width) */}
            <div className="md:col-span-2 flex flex-col gap-3.5 text-left border-l border-none md:border-solid border-[#EBEAE4] md:pl-5">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {t('pos.productPerformance')}
              </h3>

              {popularItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <span className="text-gray-400 text-xs font-semibold">{t('pos.noSalesDetails')}</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto border border-[#0A422D]/25 rounded-lg p-3 bg-white custom-scrollbar shadow-sm">
                  {popularItems.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between items-center p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-gray-900 truncate">{item.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold capitalize mt-0.5">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-bold text-gray-900">{item.qty} {t('pos.soldQty')}</span>
                        <span className="text-[9px] text-[#0A422D] font-bold mt-0.5">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OrderDetailModal
        selectedNotif={selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />
    </>
  );
};

import React, { useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { OrderTypeTabs } from './OrderTypeTabs';
// import { CustomerDetails } from './CustomerDetails';
import { CartItem } from './CartItem';
import { PaymentSummary } from './PaymentSummary';
import { CheckoutButton } from './CheckoutButton';
import { TableLayout } from '../../pos/components/TableLayout';
import { List, ShoppingCart, Tag, X, CheckCircle, Armchair, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PaymentModal } from './PaymentModal';
import { formatCurrency } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';
import api from '../../../api';

export const CartSidebar: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(() => {
    try {
      return localStorage.getItem('pos_dialogOpen') === 'true';
    } catch { return false; }
  });
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);
  const [isTableDialogOpen, setIsTableDialogOpen] = React.useState(false);
  const { t, i18n } = useTranslation();
  const {
    cart,
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    tableNumber,
    setTableNumber,
    receiptNumber,
    holdCurrentOrder,
    couponCode,
    setCouponCode,
    discount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    activeShift,
  } = useOrder();

  const isNoShift = !activeShift;

  const dialogMaxwidth = i18n.language === 'id' ? 'sm:max-w-[430px]' : 'sm:max-w-md';

  const subtotal = cart.reduce((sum, item) => {
    const sizePriceModifier = item.size === 'small' ? -2000 : item.size === 'large' ? 5000 : 0;
    return sum + (item.product.price + sizePriceModifier) * item.quantity;
  }, 0);

  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax - discount;

  const isCartEmpty = cart.length === 0;

  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(undefined);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const handleTableSelect = (table: any) => {
    setTableNumber(table.label);
    setSelectedTableId(table._id);
    setSelectedTable(table);
    setIsTableDialogOpen(false);
  };

  const handleFreeTable = async (table: any) => {
    try {
      await api.put(`/tables/${table._id}/status`, { status: 'available' });
    } catch (error) {
      console.error('Failed to free table', error);
    }
  };

  React.useEffect(() => {
    setSelectedTable(null);
    setTableNumber('');
  }, []);

  React.useEffect(() => {
    localStorage.setItem('pos_dialogOpen', String(isDialogOpen));
  }, [isDialogOpen]);

  return (
    <aside className="w-[500px] shrink-0 border-l border-[#EBEAE4] bg-[#FFFFFF] flex flex-col h-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="py-4 px-6 flex items-center justify-between border-b border-transparent shrink-0">
        <div className="size-9" />
        <div className="flex flex-col text-center">
          <h2 className="text-[15px] font-black text-gray-950 leading-none tracking-tight">{t('pos.currentOrder')}</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center justify-center size-9 border border-[#0A422D]/25 hover:bg-gray-50 text-[#0A422D] rounded-full transition-all cursor-pointer active:scale-95">
              <List className="size-4" />
            </button>
          </DialogTrigger>
          <DialogContent className={`bg-white border border-[#EBEAE4] rounded-2xl p-6 text-left shadow-xl ${dialogMaxwidth}`}>
            <DialogHeader className="mb-4 text-left">
              <DialogTitle className="text-[16px] font-black text-gray-950 tracking-tight leading-none">{t('pos.purchaseReceipt')}</DialogTitle>
              <DialogDescription className="text-xs font-bold text-gray-400 mt-1 block">ID {receiptNumber}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5">
              {/* Order Type */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('pos.orderType')}</span>
                <OrderTypeTabs activeType={orderType} onChange={setOrderType} />
              </div>
              {/* Customer Details */}
              <div className="border-t border-[#EBEAE4] pt-4 flex flex-col gap-2">
                {orderType === 'dine_in' ? (
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('pos.customerName')}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder={t('pos.enterName')}
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full h-10 pl-9 pr-3 bg-white border border-[#EBEAE4] rounded-xl focus:outline-none focus:border-[#0A422D] text-sm font-semibold"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('pos.table')}</label>
                      <button
                        type="button"
                        onClick={() => setIsTableDialogOpen(true)}
                        className="w-full h-10 px-3 bg-white border border-[#EBEAE4] rounded-xl text-left text-sm font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <Armchair className="size-4 text-[#0A422D] shrink-0" />
                        {selectedTable ? (
                          <span className="text-gray-900 text-sm font-semibold truncate">
                            {selectedTable.zone === 'vip' ? `${selectedTable.label} - ${selectedTable.capacity} Kursi` : `${selectedTable.label} ${selectedTable.zone.charAt(0).toUpperCase() + selectedTable.zone.slice(1)} - ${selectedTable.capacity} Kursi`}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Pilih Meja</span>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('pos.customerName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('pos.enterName')}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 bg-white border border-[#EBEAE4] rounded-xl focus:outline-none focus:border-[#0A422D] text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Coupon */}
              <div className="border-t border-[#EBEAE4] pt-4 flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('pos.couponCode', 'Coupon Code')}</span>
                {appliedCoupon ? (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-emerald-700">{appliedCoupon.code}</span>
                      <span className="text-[10px] text-emerald-600 ml-1.5">
                        {appliedCoupon.type === 'percentage'
                          ? `${appliedCoupon.value}% off`
                          : `Rp ${appliedCoupon.value.toLocaleString()} off`}
                        {' - '}{formatCurrency(discount)} {t('pos.discount', 'discount')}
                      </span>
                    </div>
                    <button onClick={removeCoupon} className="text-emerald-600 hover:text-red-500 transition-colors cursor-pointer p-0.5">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder={t('pos.enterCouponCode', 'Enter coupon code')}
                        className="w-full h-9 pl-8 pr-3 bg-white border border-[#EBEAE4] rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-[#0A422D] uppercase tracking-wider"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!couponCode.trim() || isCartEmpty}
                      onClick={() => applyCoupon(subtotal)}
                      className={`h-9 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !couponCode.trim() || isCartEmpty
                          ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          : "bg-[#0A422D] hover:bg-[#0A422D]/90 text-white"
                      }`}
                    >
                      {t('pos.apply', 'Apply')}
                    </button>
                  </div>
                )}
              </div>
              {/* Actions: Proceed to Payment or Hold Order */}
              <div className="border-t border-[#EBEAE4] pt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={isNoShift || !customerName.trim() || (orderType === 'dine_in' && !tableNumber)}
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsPaymentOpen(true);
                  }}
                  className={`w-full h-11 rounded-xl font-bold text-sm transition-all duration-200 select-none flex items-center justify-center gap-2 ${isNoShift || !customerName.trim() || (orderType === 'dine_in' && !tableNumber)
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : "bg-[#0A422D] hover:bg-[#0A422D]/90 text-white shadow-sm cursor-pointer active:scale-[0.98]"
                    }`}
                >
                  {t('pos.proceedToPayment')} - {formatCurrency(total)}
                </button>
                <button
                  type="button"
                  disabled={isCartEmpty || isNoShift || !customerName.trim() || (orderType === 'dine_in' && !tableNumber)}
                  onClick={() => {
                    holdCurrentOrder();
                    setIsDialogOpen(false);
                  }}
                  className={`w-full h-11 rounded-xl font-bold text-sm transition-all duration-200 select-none flex items-center justify-center gap-2 ${isCartEmpty || isNoShift || !customerName.trim() || (orderType === 'dine_in' && !tableNumber)
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : "bg-[#940707] hover:bg-[#940707]/90 text-red-100 border border-transparent shadow-sm cursor-pointer active:scale-[0.98]"
                    }`}
                >
                  {t('pos.holdOrder')}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Order List wrapped in a Green outline card */}
      <div className="flex-1 overflow-hidden px-6 py-3 flex flex-col text-left min-h-[220px]">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
          {t('pos.orderList')}
        </h3>
        <div className="flex-1 border p-2 rounded-lg bg-white overflow-y-auto flex flex-col gap-2.5 custom-scrollbar ">
          {isCartEmpty ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="flex items-center justify-center size-12 bg-gray-50 text-gray-400 rounded-xl mb-2.5 border border-dashed border-gray-250">
                <ShoppingCart className="size-5.5" />
              </div>
              <h4 className="font-bold text-gray-800 text-sm">{t('pos.cartEmpty')}</h4>
              <p className="text-gray-500 text-xs mt-1 max-w-[200px]">
                {t('pos.cartEmptyDesc')}
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <CartItem key={`${item.product.id}-${item.size}`} item={item} />
            ))
          )}
        </div>
      </div>
      {/* Payment Summary & Sliding Checkout Action */}
      <div className="p-4 px-6 border-t border-[#EBEAE4] bg-[#FFFFFF] flex flex-col gap-4 shrink-0">
        <PaymentSummary subtotal={subtotal} tax={tax} discount={discount} total={total} />
        <div className="flex-1">
          <CheckoutButton
            total={total}
            onConfirm={() => {
              setIsDialogOpen(true);
              return false;
            }}
            disabled={isCartEmpty || isNoShift}
          />
        </div>
      </div>
      <PaymentModal
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        total={total}
      />

      {/* Table Selection Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6 text-left shadow-xl">
          <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
            <DialogTitle className="text-base font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none">
              {t('pos.selectTable', 'Select Table')}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400 mt-1 block">
              {t('pos.selectTableDesc', 'Choose a table for this order')}
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <TableLayout onSelectTable={handleTableSelect} onFreeTable={handleFreeTable} selectedTableId={selectedTableId} />
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
};

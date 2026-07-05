import React from 'react';
import { formatCurrency } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';

interface PaymentSummaryProps {
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  subtotal,
  tax,
  discount = 0,
  total,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2 text-left">
      <h4 className="font-bold text-gray-900 text-sm tracking-tight mb-0.5">
        {t('pos.paymentDetails')}
      </h4>

      <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
        <span>{t('pos.subtotal')}</span>
        <span className="text-gray-900 product-price">{formatCurrency(subtotal)}</span>
      </div>

      <div className="flex justify-between items-center text-xs font-semibold text-gray-500">
        <span>{t('pos.tax')}</span>
        <span className="text-gray-900 product-price">{formatCurrency(tax)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between items-center text-xs font-semibold text-emerald-600">
          <span>{t('pos.discount', 'Discount')}</span>
          <span className="product-price">-{formatCurrency(discount)}</span>
        </div>
      )}

      <div className="flex justify-between items-center text-sm font-extrabold text-gray-900 pt-1 border-t border-dashed border-[#EBEAE4]">
        <span>{t('pos.total')}</span>
        <span className="text-base text-[#0A422D]">{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

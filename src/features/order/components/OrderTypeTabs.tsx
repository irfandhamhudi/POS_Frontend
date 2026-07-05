import React from 'react';
import type { OrderType } from '../types';
import { cn } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';

interface OrderTypeTabsProps {
  activeType: OrderType;
  onChange: (type: OrderType) => void;
}

export const OrderTypeTabs: React.FC<OrderTypeTabsProps> = ({
  activeType,
  onChange,
}) => {
  const { t } = useTranslation();
  const tabs: { id: OrderType; label: string }[] = [
    { id: 'dine_in', label: t('pos.dineIn') },
    { id: 'take_away', label: t('pos.takeAway') },
    { id: 'order_online', label: t('pos.orderOnline') },
  ];

  return (
    <div className="flex p-1.5 bg-[#FAF9F5] border border-[#EBEAE4] rounded-2xl w-full">
      {tabs.map((tab) => {
        const isActive = activeType === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer select-none text-center",
              isActive
                ? "bg-[#0A422D] text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

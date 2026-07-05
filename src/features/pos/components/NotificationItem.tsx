import React from 'react';
import { Trash2, Info, ShoppingBag, ClipboardX, Palette, UserCheck, UserX, CheckCircle, Settings, UserCog } from 'lucide-react';
import { cn, formatCurrency } from 'src/lib/utils';
import type { POSNotification } from '../../order/context/OrderContext';
import { useTranslation } from '../../../hooks/useTranslation';

interface NotificationItemProps {
  notif: POSNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSeeDetail: (notif: POSNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notif,
  onMarkAsRead,
  onDelete,
  onSeeDetail,
}) => {
  const { t } = useTranslation();

  const getLocalizedTitle = (title: string) => {
    if (title.toLowerCase().includes('out of stock')) {
      return t('notifications.outOfStockTitle', 'Out of Stock Alert');
    }
    if (title.toLowerCase().includes('low stock')) {
      return t('notifications.lowStockTitle', 'Low Stock Warning');
    }
    if (title.toLowerCase().includes('shift ended automatically') || title.toLowerCase().includes('shift berakhir otomatis')) {
      return t('notifications.shiftEndedAutoTitle', 'Shift Ended Automatically');
    }
    return title; // For customer names or other dynamic titles
  };

  const getLocalizedMessage = (message: string) => {
    if (message.toLowerCase().includes('canceled the order')) {
      return t('notifications.canceledOrder', 'Canceled the order.');
    }
    if (message.toLowerCase().includes('ordered 3 meals and 1 drink')) {
      return t('notifications.orderedCountAndDrink', { count: 3, drinkCount: 1 });
    }
    if (message.toLowerCase().includes('ordered 3 meals')) {
      return t('notifications.orderedCount', { count: 3 });
    }
    if (message.toLowerCase().includes('is now out of stock')) {
      const match = message.match(/"([^"]+)"/);
      const name = match ? match[1] : '';
      return t('notifications.outOfStockDesc', { name });
    }
    if (message.toLowerCase().includes('items left in stock')) {
      // e.g. "Peach Oolong Tea has only 2 items left in stock."
      const matchName = message.match(/^([^\s].+?)\s+has\s+only/);
      const matchCount = message.match(/only\s+(\d+)\s+items/);
      const name = matchName ? matchName[1] : '';
      const count = matchCount ? matchCount[1] : '';
      return t('notifications.lowStockDesc', { name, count });
    }
    if (message.toLowerCase().includes('cancelled the order')) {
      // e.g. "Cancelled the order #GG-83920. Items returned to stock."
      const match = message.match(/order\s+#?([A-Z0-9-]+)/i);
      const receiptNumber = match ? match[1] : '';
      return t('notifications.cancelledOrderDesc', { receiptNumber });
    }
    if (message.toLowerCase().includes('ordered')) {
      // e.g. "Ordered 2 meals"
      const match = message.match(/ordered\s+(\d+)\s+meals/i);
      if (match) {
        return t('notifications.orderedCount', { count: parseInt(match[1], 10) });
      }
    }
    if (message.toLowerCase().includes('was automatically ended') || message.toLowerCase().includes('otomatis diakhiri')) {
      // e.g. "Shift for John was automatically ended by the system because operational hours have ended."
      const matchName = message.match(/(?:shift for|shift untuk)\s+(.+?)\s+(?:was|di)/i);
      const name = matchName ? matchName[1] : 'Cashier';
      return t('notifications.shiftEndedAutoMessage', { name });
    }
    return message;
  };

  let IconComponent = Info;
  let iconBgClass = "bg-[#EFF6FF] dark:bg-[#1E293B]";
  let iconColorClass = "text-[#3B82F6]";

  const titleLower = notif.title.toLowerCase();

  if (titleLower.includes('clock in')) {
    IconComponent = UserCheck;
    iconBgClass = "bg-[#ECFDF5] dark:bg-[#064E3B]";
    iconColorClass = "text-[#10B981]";
  } else if (titleLower.includes('clock out')) {
    IconComponent = UserX;
    iconBgClass = "bg-[#FCECE8] dark:bg-[#3D1F1C]";
    iconColorClass = "text-[#E0533C]";
  } else if (titleLower.includes('shift berakhir') || titleLower.includes('shift ended')) {
    IconComponent = UserCog;
    iconBgClass = "bg-[#FDF7E7] dark:bg-[#2B2414]";
    iconColorClass = "text-[#C97C2B]";
  } else if (titleLower.includes('setting') || titleLower.includes('pengaturan')) {
    IconComponent = Settings;
    iconBgClass = "bg-[#EFF6FF] dark:bg-[#1E293B]";
    iconColorClass = "text-[#3B82F6]";
  } else if (notif.type === 'order') {
    IconComponent = ShoppingBag;
    iconBgClass = "bg-[#FDF7E7] dark:bg-[#2B2414]";
    iconColorClass = "text-[#C97C2B]";
  } else if (notif.type === 'cancel') {
    IconComponent = ClipboardX;
    iconBgClass = "bg-[#FCECE8] dark:bg-[#3D1F1C]";
    iconColorClass = "text-[#E0533C]";
  } else if (notif.type === 'warning') {
    IconComponent = Palette;
    iconBgClass = "bg-gray-100 dark:bg-neutral-800";
    iconColorClass = "text-black dark:text-white";
  } else if (notif.type === 'success') {
    IconComponent = CheckCircle;
    iconBgClass = "bg-[#ECFDF5] dark:bg-[#064E3B]";
    iconColorClass = "text-[#10B981]";
  }

  return (
    <div
      onClick={() => onMarkAsRead(notif.id)}
      className={cn(
        "group/item relative flex gap-4 px-6 py-5 hover:bg-gray-50/40 dark:hover:bg-[#2D2D2A]/30 transition-all cursor-pointer",
        !notif.read ? 'bg-[#FAF9F5]/40 dark:bg-[#232320]/40' : ''
      )}
    >
      {/* Left: Status Icon Avatar */}
      <div className={cn("flex items-center justify-center w-11 h-11 rounded-lg shrink-0 border border-transparent", iconBgClass)}>
        <IconComponent className={cn("size-5.5", iconColorClass)} />
      </div>

      {/* Middle: Title, Meta, Message, Items list */}
      <div className="flex-1 flex flex-col min-w-0 text-left">
        {/* Title and Time Row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-none">{getLocalizedTitle(notif.title)}</span>
          <span className="text-gray-300 dark:text-gray-650 text-xs select-none">-</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold leading-none">{notif.time}</span>
        </div>

        {/* Description Message */}
        <p className={cn(
          "text-xs mt-1.5 leading-snug",
          notif.type === 'cancel'
            ? "text-[#E0533C] font-semibold"
            : "text-gray-500 dark:text-gray-400 font-medium"
        )}>
          {getLocalizedMessage(notif.message)}
        </p>

        {/* Nested Items Cards */}
        {notif.items && notif.items.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {notif.items.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#262623] border border-[#EBEAE4]/80 dark:border-[#2D2D2A] shadow-sm rounded-lg px-4 py-2.5 flex justify-between items-center gap-3"
              >
                <div className="text-xs truncate flex items-center min-w-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-8 h-8 rounded-lg object-cover mr-2.5 border border-gray-150 dark:border-[#2D2D2A] shrink-0"
                    />
                  )}
                  <span className="text-gray-400 dark:text-gray-500 font-medium mr-1.5 shrink-0">{item.quantity}x</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</span>
                </div>
                <span className="font-extrabold text-gray-955 dark:text-gray-55 text-xs shrink-0">{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons (e.g. Trash & See Detail) */}
        <div className="flex justify-end items-center gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notif.id);
            }}
            className="p-1.5 bg-white dark:bg-[#262623] border border-[#EBEAE4]/80 dark:border-[#2D2D2A] hover:bg-red-50 dark:hover:bg-red-600 text-gray-400 hover:text-red-500 dark:hover:!text-red-500 transition-all cursor-pointer rounded-lg flex items-center justify-center active:scale-95"
            title={t('notifications.deleteNotification', 'Delete notification')}
          >
            <Trash2 className="size-4" />
          </button>

          {notif.type === 'order' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSeeDetail(notif);
              }}
              className="border border-[#0A422D] hover:border-[#0A422D]/80 text-[#0A422D] hover:bg-[#0A422D]/10 dark:border-[#4ADE80] dark:text-[#4ADE80] dark:hover:border-[#22C55E] dark:hover:text-[#22C55E] dark:hover:bg-[#4ADE80]/10 transition-all rounded-lg px-5 py-1.5 text-xs font-bold bg-transparent cursor-pointer active:scale-95"
            >
              {t('notifications.seeDetail', 'See Detail')}
            </button>
          )}
        </div>
      </div>

      {/* Right: Unread Dot */}
      <div className="flex flex-col items-end shrink-0">
        {!notif.read && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#0a7c19] dark:bg-[#4ADE80] shrink-0 mt-1.5" />
        )}
      </div>
    </div>
  );
};

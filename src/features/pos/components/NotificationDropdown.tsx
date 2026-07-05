import React, { useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { useOrder } from '../../order/context/OrderContext';
import type { POSNotification } from '../../order/context/OrderContext';
import { NotificationItem } from './NotificationItem';
import { OrderDetailModal } from './OrderDetailModal';
import { useTranslation } from '../../../hooks/useTranslation';

export const NotificationDropdown: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications = [],
    markAllAsRead = () => { },
    markAsRead = () => { },
    deleteNotification = () => { },
    deleteAllNotifications = () => { },
  } = useOrder() || {};

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0;

  // Selected notification for "See Detail" modal
  const [selectedNotif, setSelectedNotif] = useState<POSNotification | null>(null);

  return (
    <div className="relative z-25">
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Notification bell clicked. Current state isOpen:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="relative p-2.5 bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2D2D2A] text-gray-600 dark:text-gray-300 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
      >
        <Bell className="size-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-black leading-none border-2 border-white dark:border-[#1C1C19] dark:bg-red-600">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop Overlay to Close on Click Away */}
          <div
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown Card */}
          <div className="absolute right-0 mt-2 w-105 bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg shadow-xl z-40 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col text-left overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#EBEAE4] dark:border-[#2D2D2A]">
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{t('notifications.title', 'Notifications')}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-655 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex flex-col max-h-105 overflow-y-auto custom-scrollbar divide-y divide-[#EBEAE4]/60 dark:divide-[#2D2D2A]/60">
              {notifications.length === 0 ? (
                /* Empty State */
                <div className="py-10 flex flex-col items-center justify-center text-center px-4 select-none">
                  <div className="flex items-center justify-center size-10 bg-gray-50 text-gray-400 rounded-lg mb-2.5 border border-gray-100 dark:bg-neutral-900 dark:border-neutral-800">
                    <BellOff className="size-4.5" />
                  </div>
                  <h5 className="font-bold text-gray-800 text-xs">{t('notifications.noNotifications', 'No notifications')}</h5>
                  <p className="text-gray-450 text-[10px] mt-1">
                    {t('notifications.upToDate', 'Everything is up to date.')}
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <NotificationItem
                    key={notif.id}
                    notif={notif}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onSeeDetail={setSelectedNotif}
                  />
                ))
              )}
            </div>

            <div className="flex justify-between items-center px-6 py-4.5 border-t border-[#EBEAE4] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C19] rounded-b-2xl">
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-[#0A422D] hover:text-[#0A422D]/80 dark:text-[#4ADE80] dark:hover:text-[#22C55E] hover:underline bg-transparent border-0 cursor-pointer p-0 transition-all"
              >
                {t('notifications.markAllRead', 'Mark all as read')}
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={deleteAllNotifications}
                  className="text-xs font-bold text-red-600 hover:text-red-500 hover:underline bg-transparent border-0 cursor-pointer p-0 transition-all"
                >
                  {t('notifications.deleteAll', 'Delete all')}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Detail Dialog */}
      <OrderDetailModal
        selectedNotif={selectedNotif}
        onClose={() => setSelectedNotif(null)}
      />
    </div>
  );
};

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '../../auth/context/AuthContext';
import { useOrder } from '../../order/context/OrderContext';
import { useTranslation } from 'src/hooks/useTranslation';
import { formatCurrency } from 'src/lib/utils';
import { User, UserLock } from 'lucide-react';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { activeShift } = useOrder();
  const { t } = useTranslation();

  const formattedStartTime = activeShift?.startTime
    ? new Date(activeShift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border border-[#EBEAE4] dark:bg-[#1C1C19] dark:border-[#2D2D2A] rounded-lg p-6 text-left shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
          <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none">
            {t('posProfile.title', 'Cashier Profile')}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 font-medium text-xs mt-1 block">
            {t('posProfile.subtitle', 'Details for the logged-in staff member.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          <div className="size-24 border-2 border-[#0A422D]/20 dark:border-emerald-500/20 bg-[#0A422D]/10 dark:bg-emerald-500/10 text-[#0A422D] dark:text-[#4ADE80] flex items-center justify-center rounded-full shadow-sm shrink-0">
            {user?.role === 'admin' ? (
              <UserLock className="size-10" />
            ) : (
              <User className="size-10" />
            )}
          </div>
          <div className="text-center">
            <h3 className="font-extrabold text-gray-950 dark:text-white text-base leading-tight">
              {user?.name || t('posProfile.userProfile', 'User Profile')}
            </h3>
            <p className="text-xs font-bold text-[#0A422D] dark:text-[#4ADE80] bg-[#0A422D]/10 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-block mt-1.5 capitalize">
              {user?.role === 'admin' ? t('userManagement.adminRole', 'Administrator') : t('userManagement.cashierRole', 'Cashier')}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 bg-gray-50/50 dark:bg-zinc-900/50 border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 dark:text-gray-500">{t('posProfile.employeeId', 'Employee ID')}</span>
            <span className="font-extrabold text-gray-950 dark:text-white">
              {user ? `GG-${user.role === 'admin' ? 'ADM' : 'KSR'}-${user._id.slice(-4).toUpperCase()}` : t('posProfile.notAvailable', 'N/A')}
            </span>
          </div>
          
          <div className="border-t border-[#EBEAE4]/60 dark:border-[#2D2D2A]/60" />
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 dark:text-gray-500">{t('posProfile.emailAddress', 'Email Address')}</span>
            <span className="font-extrabold text-gray-950 dark:text-white">
              {user?.username ? `${user.username}@greengrounds.coffee` : 'info@greengrounds.coffee'}
            </span>
          </div>

          <div className="border-t border-[#EBEAE4]/60 dark:border-[#2D2D2A]/60" />

          <div className="flex justify-between items-center">
            <span className="text-gray-400 dark:text-gray-500">{t('posProfile.activeShift', 'Active Shift')}</span>
            <span className="font-extrabold text-gray-950 dark:text-white">
              {activeShift ? t('posProfile.active', 'Active') : t('posProfile.inactive', 'Inactive')}
            </span>
          </div>

          {activeShift && (
            <>
              <div className="border-t border-[#EBEAE4]/60 dark:border-[#2D2D2A]/60" />
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-gray-500">{t('posProfile.shiftStart', 'Shift Started At')}</span>
                <span className="font-extrabold text-gray-950 dark:text-white">
                  {formattedStartTime || t('posProfile.notAvailable', 'N/A')}
                </span>
              </div>

              <div className="border-t border-[#EBEAE4]/60 dark:border-[#2D2D2A]/60" />

              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-gray-500">{t('posProfile.startingCash', 'Starting Cash')}</span>
                <span className="font-extrabold text-gray-950 dark:text-white">
                  {formatCurrency(activeShift.startingCash || 0)}
                </span>
              </div>

              <div className="border-t border-[#EBEAE4]/60 dark:border-[#2D2D2A]/60" />

              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-gray-500">{t('posProfile.totalSales', 'Total Sales')}</span>
                <span className="font-extrabold text-gray-950 dark:text-white">
                  {formatCurrency(activeShift.totalSales || 0)}
                </span>
              </div>

              <div className="border-t border-[#EBEAE4]/60 dark:border-[#2D2D2A]/60" />

              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-gray-500">{t('posProfile.totalOrders', 'Total Orders')}</span>
                <span className="font-extrabold text-gray-950 dark:text-white">
                  {activeShift.totalOrders || 0}
                </span>
              </div>
            </>
          )}

          <div className="border-t border-[#EBEAE4]/60 dark:border-[#2D2D2A]/60" />
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400 dark:text-gray-500">{t('posProfile.registerStation', 'Register Station')}</span>
            <span className="font-extrabold text-gray-950 dark:text-white">
              {t('posProfile.registerStationVal', 'POS Terminal #1')}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

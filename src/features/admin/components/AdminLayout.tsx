import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from 'src/components/ui/sidebar';
import { AppSidebar } from 'src/components/app-sidebar';
import { TooltipProvider } from 'src/components/ui/tooltip';
import { Separator } from 'src/components/ui/separator';
import { SettingsModal } from 'src/features/pos/components/SettingsModal';
import { NotificationDropdown } from 'src/features/pos/components/NotificationDropdown';
import { OrderProvider } from 'src/features/order/context/OrderContext';

import { useTranslation } from 'src/hooks/useTranslation';

const BREADCRUMB_MAP: Record<string, { key: string; fallback: string }> = {
  '/admin': { key: 'sidebar.dashboard', fallback: 'Dashboard' },
  '/admin/orders': { key: 'sidebar.orders', fallback: 'Orders' },
  '/admin/menu': { key: 'sidebar.menuManagement', fallback: 'Menu' },
  '/admin/reports': { key: 'sidebar.reports', fallback: 'Reports' },
  '/admin/users': { key: 'sidebar.userManagement', fallback: 'Users' },
  '/admin/salary': { key: 'sidebar.salaryManagement', fallback: 'Salary' },
  '/admin/coupons': { key: 'sidebar.couponManagement', fallback: 'Coupons' },
  '/admin/shifts': { key: 'sidebar.shiftManagement', fallback: 'Shifts' },
  '/admin/tables': { key: 'sidebar.tableManagement', fallback: 'Tables' },
  '/admin/help': { key: 'helpSupport.title', fallback: 'Help & Support' },
};

export const AdminLayout: React.FC = () => {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();
  const breadcrumbInfo = BREADCRUMB_MAP[location.pathname];
  const currentPage = breadcrumbInfo ? t(breadcrumbInfo.key, breadcrumbInfo.fallback) : 'Management';

  return (
    <TooltipProvider>
      <OrderProvider source="admin">
        <SidebarProvider>
          <AppSidebar onSettingsClick={() => setIsSettingsOpen(true)} />
          <SidebarInset className="bg-[#FAF9F5] dark:bg-zinc-900 flex flex-col min-h-screen">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-white dark:bg-zinc-900 sticky top-0 z-30 px-4 lg:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mx-2 data-[orientation=vertical]:h-4"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">POS Admin</span>
                  <span className="text-sm text-muted-foreground/60">/</span>
                  <span className="text-sm font-medium text-foreground">{currentPage}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <NotificationDropdown />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
              <Outlet />
            </main>
          </SidebarInset>
          <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </SidebarProvider>
      </OrderProvider>
    </TooltipProvider>
  );
};

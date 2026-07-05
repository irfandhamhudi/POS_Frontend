import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/components/LoginPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { POSLayout } from './features/pos/components/POSLayout';
import { AdminLayout } from './features/admin/components/AdminLayout';
import { AdminDashboardWrapper } from './features/admin/components/AdminDashboardWrapper';
import { OrderManagement } from './features/admin/components/ordermanagement/OrderManagement';
import { MenuManagement } from './features/admin/components/menumanagement/MenuManagement';
import { ReportManagement } from './features/admin/components/reportmanagement/ReportManagement';
import { UserManagement } from './features/admin/components/usermanagement/UserManagement';
import { CouponManagement } from './features/admin/components/couponmanagement/CouponManagement';
import { SalaryManagement } from './features/admin/components/salarymanagement/SalaryManagement';
import { ShiftManagement } from './features/admin/components/shiftmanagement/ShiftManagement';
import { TableManagement } from './features/admin/components/tablemanagement/TableManagement';
import { HelpSupport } from './features/admin/components/helpsupport/HelpSupport';
import { useAuth } from './features/auth/context/AuthContext';
import { KitchenDisplay } from './features/kitchen/components/KitchenDisplay';
import { PublicMenu } from './features/menu/components/PublicMenu';
import { OrderStatusTracker } from './features/menu/components/OrderStatusTracker';

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
    <div className="w-full max-w-4xl space-y-8">
      {/* Skeleton for Header/Nav */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Skeleton for Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar/Left Column */}
        <div className="col-span-1 space-y-4">
          <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        
        {/* Main/Right Column */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-32 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="h-64 w-full bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const RootRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={user?.role === 'admin' ? '/admin' : '/pos'} replace />;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/pos',
    element: (
      <ProtectedRoute allowedRole="cashier">
        <POSLayout />
      </ProtectedRoute>
    ),
  },
  {
    path: '/kitchen',
    element: <KitchenDisplay />,
  },
  {
    path: '/menu',
    element: <PublicMenu />,
  },
  {
    path: '/menu/status/:receiptNumber',
    element: <OrderStatusTracker />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRole="admin">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboardWrapper />,
      },
      {
        path: 'orders',
        element: <OrderManagement />,
      },
      {
        path: 'menu',
        element: <MenuManagement />,
      },
      {
        path: 'reports',
        element: <ReportManagement />,
      },
      {
        path: 'users',
        element: <UserManagement />,
      },
      {
        path: 'salary',
        element: <SalaryManagement />,
      },
      {
        path: 'coupons',
        element: <CouponManagement />,
      },
      {
        path: 'shifts',
        element: <ShiftManagement />,
      },
      {
        path: 'tables',
        element: <TableManagement />,
      },
      {
        path: 'help',
        element: <HelpSupport />,
      },
    ],
  },
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}



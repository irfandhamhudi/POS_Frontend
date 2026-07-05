import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Toaster } from 'src/components/ui/toaster';
import { POSHeader } from './POSHeader';
import { CartSidebar } from '../../order/components/CartSidebar';
import { SearchBar } from '../../menu/components/SearchBar';
import { CategoryCard } from '../../menu/components/CategoryCard';
import { ProductGrid } from '../../menu/components/ProductGrid';
import { ReportModal } from '../../report/components/ReportModal';
import { useProducts } from '../../menu/hooks/useProducts';
import { OrderProvider, useOrder } from '../../order/context/OrderContext';
import { useTranslation } from '../../../hooks/useTranslation';
import api from 'src/api';
import { Lock } from 'lucide-react';

export const POSLayoutContent: React.FC<{
  productsState: ReturnType<typeof useProducts>;
}> = ({ productsState }) => {
  const { currentLanguage, t } = useTranslation();
  const { activeShift } = useOrder();

  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredProducts,
    loading,
  } = productsState;
    const [isLocked, setIsLocked] = useState(false);
  const [lockedMessage, setLockedMessage] = useState('');
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/shifts/settings');
        if (res.data?.success) {
          const { openHour, closeHour, now } = res.data.data;
          // closeHour=24 means 24-hour operation — never lock
          if (closeHour !== 24 && (now < openHour || now >= closeHour)) {
            setIsLocked(true);
            setLockedMessage(t('pos.systemLocked', `System locked. Operational hours are ${openHour}:00 to ${closeHour}:00`));
          }
        }
      } catch (err) {
        // If backend is unreachable, don't lock the POS
        console.error('Failed to fetch shift settings', err);
      }
    };
    fetchSettings();
  }, [t]);
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const formattedDate = new Intl.DateTimeFormat(currentLanguage === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(time);
  const formattedTime = time.toLocaleTimeString(currentLanguage === 'id' ? 'id-ID' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: currentLanguage !== 'id',
  });
  
  if (loading) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FAF9F5] text-gray-900 font-sans">
        <POSHeader />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col p-8 overflow-y-auto min-w-0 custom-scrollbar animate-pulse">
            <div className="mb-6 flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full " />
              </div>
              <div className="hidden md:flex items-center shrink-0 h-12 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
            
            <div className="mb-7 pt-2">
              <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="relative flex flex-col justify-between flex-1 min-w-50 h-36.25 p-5 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden select-none active:scale-[0.98] bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                ))}
              </div>
            </div>
          </main>
          
          <div className="w-100 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col p-6 animate-pulse lg:flex">
             <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-6" />
             <div className="flex-1 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-24 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                ))}
             </div>
             <div className="h-32 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg mt-auto" />
          </div>
        </div>
      </div>
    );
  }

    if (isLocked) {
    return (
      <div className="flex flex-col h-screen w-screen bg-[#FAF9F5] text-gray-900 font-sans items-center justify-center">
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#EBEAE4] shadow-sm max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="size-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">{t('pos.lockedTitle', 'System Locked')}</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">{lockedMessage}</p>
          <div className="w-full flex justify-center">
            <button 
              onClick={() => window.location.href = '/login'} 
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-xl transition-colors active:scale-95">
              {t('pos.returnToLogin', 'Return to Login')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FAF9F5] text-gray-900 font-sans">
      {/* Top Header */}
      <POSHeader />
      {/* Main Grid: Menu Grid (Left) + Cart Sidebar (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section: Menu Screen */}
        <main className="flex-1 flex flex-col p-8 overflow-y-auto min-w-0 custom-scrollbar">
          
          {/* Row 1: Search Bar & Date Display */}
          <div className="mb-6 flex items-center justify-between gap-6">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="hidden md:flex items-center shrink-0 h-12 px-4 bg-white border border-[#EBEAE4] rounded-lg text-[#0A422D] gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-[#0A422D]/70" />
                <span className="text-xs font-bold tracking-tight">{formattedDate}</span>
              </div>
              <div className="h-4 w-px bg-[#EBEAE4]" />
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#0A422D]/70" />
                <span className="text-xs font-extrabold tabular-nums">{formattedTime}</span>
              </div>
            </div>
          </div>
          {/* Row 2: Categories */}
          <div className="mb-7 pt-2">
            <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none">
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                />
              ))}
            </div>
          </div>
          {/* Row 3: Product Grid */}
          <div className="flex-1">
            <ProductGrid products={filteredProducts} disabled={!activeShift} disabledMessage={t('pos.noShiftWarning', 'Please clock in first to start accepting orders')} />
          </div>
        </main>
        {/* Right Section: Purchase Receipt Sidebar */}
        <CartSidebar />
      </div>
      {/* Report Summary Modal Dialog */}
      <ReportModal />
      {/* Toaster Component */}
      <Toaster />
    </div>
  );
};
export const POSLayout: React.FC = () => {
  const productsState = useProducts();
  return (
    <OrderProvider updateProductStock={productsState.updateStock} source="pos">
      <POSLayoutContent productsState={productsState} />
    </OrderProvider>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import api from 'src/api';
import { Card, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { useTranslation } from 'src/hooks/useTranslation';
import {
  ChefHat,
  Clock,
  Volume2,
  VolumeX,
  Check,
  Play,
  TrendingUp,
  ArrowLeft,
  Loader2,
  Flame,
  Bell,
  ShoppingBag,
  Armchair,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface ProductDetails {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface CartItem {
  product: ProductDetails;
  quantity: number;
  size: 'small' | 'medium' | 'large';
  notes: string;
}

interface Order {
  _id: string;
  receiptNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: 'dine_in' | 'take_away' | 'order_online';
  customerName: string;
  tableNumber: string;
  paymentMethod: string;
  kitchenStatus: 'pending' | 'preparing' | 'ready' | 'served';
  createdAt: string;
}

export const KitchenDisplay: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t, i18n } = useTranslation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return document.documentElement.classList.contains('dark');
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(new Date());
  const [currentTimeText, setCurrentTimeText] = useState('');

  const prevOrdersCountRef = useRef<number>(0);

  // Sync dark theme on mount and change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Sync theme and language from storage events (cross-tab sync)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setIsDarkMode(e.newValue === 'dark');
      }
      if (e.key === 'i18nextLng' && e.newValue) {
        i18n.changeLanguage(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [i18n]);


  // Keep track of current time for elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Digital clock for header
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeText(
        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Play synthesized double chime when a new order arrives
  const playNewOrderSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      // Pleasant double-beep chord
      playNote(587.33, audioCtx.currentTime, 0.15); // D5
      playNote(880.00, audioCtx.currentTime + 0.12, 0.3); // A5
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  const fetchOrders = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const response = await api.get('/kitchen/orders');
      if (response.data.success) {
        const fetchedOrders = response.data.data;
        setOrders(fetchedOrders);

        // Count pending (new) orders
        const pendingCount = fetchedOrders.filter((o: Order) => o.kitchenStatus === 'pending').length;

        // If pending orders increased, play sound
        if (!isInitial && pendingCount > prevOrdersCountRef.current) {
          playNewOrderSound();
        }

        prevOrdersCountRef.current = pendingCount;
      }
    } catch (error) {
      console.error('KDS Fetch Error:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // HTTP Polling: fetch every 8 seconds
  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 8000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleUpdateStatus = async (orderId: string, newStatus: 'preparing' | 'ready' | 'served') => {
    try {
      const response = await api.put(`/kitchen/orders/${orderId}/status`, { status: newStatus });
      if (response.data.success) {
        // Optimistic UI update or re-fetch
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, kitchenStatus: newStatus } : o)
          .filter(o => newStatus !== 'served' || o._id !== orderId));
      }
    } catch (error) {
      console.error('Failed to update kitchen status:', error);
    }
  };

  // Helper to calculate elapsed minutes
  const getElapsedTime = (createdAtStr: string) => {
    const createdDate = new Date(createdAtStr);
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const getElapsedTimeText = (createdAtStr: string) => {
    const mins = getElapsedTime(createdAtStr);
    if (mins < 1) return t('kitchen.newBadge', 'Baru');
    return `${mins} ${t('kitchen.minsBadge', 'mnt')}`;
  };

  // Group orders by status
  const pendingOrders = orders.filter(o => o.kitchenStatus === 'pending');
  const preparingOrders = orders.filter(o => o.kitchenStatus === 'preparing');
  const readyOrders = orders.filter(o => o.kitchenStatus === 'ready');

  const getCardStyle = (createdAtStr: string, status: 'pending' | 'preparing' | 'ready') => {
    const mins = getElapsedTime(createdAtStr);

    if (status === 'ready') {
      return {
        cardClass: 'border border-zinc-200 dark:border-zinc-800 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.04] rounded-md',
        timeBadge: 'bg-emerald-500 text-white font-extrabold animate-pulse',
        headerText: 'text-emerald-700 dark:text-emerald-450'
      };
    }

    if (mins >= 15) {
      return {
        cardClass: 'border border-zinc-200 dark:border-zinc-800 bg-red-500/[0.02] dark:bg-red-500/[0.04] rounded-md animate-pulse',
        timeBadge: 'bg-red-500 text-white font-extrabold',
        headerText: 'text-red-600 dark:text-red-400'
      };
    }

    if (mins >= 10) {
      return {
        cardClass: 'border border-zinc-200 dark:border-zinc-800 bg-amber-500/[0.02] dark:bg-amber-500/[0.04] rounded-md',
        timeBadge: 'bg-amber-500 text-white font-extrabold',
        headerText: 'text-amber-600 dark:text-amber-450'
      };
    }

    return {
      cardClass: 'border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md',
      timeBadge: 'bg-zinc-150 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-250 dark:border-zinc-750',
      headerText: 'text-zinc-900 dark:text-zinc-100'
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
        <Loader2 className="h-10 w-10 text-[#0A422D] dark:text-[#4ADE80] animate-spin mb-4" />
        <p className="text-zinc-600 dark:text-zinc-400 font-bold text-sm">{t('kitchen.loading', 'Memuat Antrean Dapur...')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/pos')}
                className="cursor-pointer rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#0A422D]/10 dark:bg-[#4ADE80]/15 rounded-md">
                <ChefHat className="h-6 w-6 text-[#0A422D] dark:text-[#4ADE80]" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white leading-none">{t('kitchen.title', 'Kitchen Display System')}</h1>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold mt-1.5 uppercase tracking-wide">
                  {t('kitchen.subtitle', 'Antrean Pesanan Real-Time Dapur & Bar')}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Digital Clock & Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-zinc-200/60 dark:bg-zinc-900 border border-zinc-300/40 dark:border-zinc-800/80 px-4 py-2 rounded-md font-mono text-sm font-black tracking-widest text-[#0A422D] dark:text-[#4ADE80] shadow-inner select-none">
              {currentTimeText}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-2 border-zinc-200 dark:border-zinc-800 hover:bg-[#0A422D]/5 dark:hover:bg-[#4ADE80]/5 text-xs font-bold cursor-pointer rounded-md h-9"
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80]" />
                    <span>{t('kitchen.soundOn', 'Suara: ON')}</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 text-zinc-400" />
                    <span className="text-zinc-400">{t('kitchen.soundOff', 'Suara: OFF')}</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrders(false)}
                disabled={isRefreshing}
                className="text-xs font-bold cursor-pointer rounded-md h-9 flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{t('kitchen.refresh', 'Segarkan')} ({orders.length})</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Board Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* COLUMN 1: PENDING (New Orders) */}
          <div className="flex flex-col gap-4 bg-zinc-100/50 dark:bg-zinc-900/30 p-3 rounded-md border border-zinc-200/60 dark:border-zinc-800/40 h-full min-h-0">
            <div className="flex items-center justify-between bg-blue-500/10 dark:bg-blue-500/20 px-4 py-3 rounded-md border border-blue-500/20">
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <Clock className="h-4.5 w-4.5 animate-pulse" />
                <h2 className="font-black text-xs uppercase tracking-wider">{t('kitchen.newOrders', 'Pesanan Baru (New)')}</h2>
              </div>
              <Badge className="font-extrabold bg-blue-500 text-white rounded-md text-xs py-0.5 px-2">{pendingOrders.length}</Badge>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 custom-scrollbar pr-1">
              {pendingOrders.map(order => {
                const style = getCardStyle(order.createdAt, 'pending');
                const isDineIn = order.orderType === 'dine_in';
                const isOnline = order.orderType === 'order_online';
                return (
                  <Card key={order._id} className={`${style.cardClass} shadow-none `}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800/60 pb-2.5">
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            {isDineIn ? (
                              <Armchair className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            ) : isOnline ? (
                              <Globe className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            ) : (
                              <ShoppingBag className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            )}
                            <h3 className={`font-black text-base ${style.headerText}`}>
                              {isDineIn ? order.tableNumber : (isOnline ? 'Online' : 'Take Away')}
                            </h3>
                          </div>
                          <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold uppercase mt-1">
                            #{order.receiptNumber} | {order.customerName}
                          </p>
                        </div>
                        <Badge variant="outline" className={`${style.timeBadge} flex items-center gap-1 text-[10px] py-0.5 px-2 rounded-md`}>
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{getElapsedTimeText(order.createdAt)}</span>
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2.5 py-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs border-b border-zinc-150/40 dark:border-zinc-850/40 pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-start gap-3 text-left w-full">
                              {item.product?.image && (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="h-10 w-10 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-extrabold text-zinc-900 dark:text-zinc-150 text-sm truncate">{item.product?.name || 'Unknown'}</p>
                                  <span className="font-black text-sm text-[#0A422D] dark:text-[#4ADE80] shrink-0">
                                    {item.quantity}x
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-450 capitalize mt-0.5">
                                  {t('kitchen.size', 'Ukuran')}: {item.size === 'small' ? t('kitchen.sizeSmall', 'kecil') : item.size === 'medium' ? t('kitchen.sizeMedium', 'sedang') : t('kitchen.sizeLarge', 'besar')}
                                  {item.notes && <span className="text-red-500 dark:text-red-400 font-bold"> - {t('kitchen.notes', 'Catatan')}: {item.notes}</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex justify-end">
                        <Button
                          size="lg"
                          onClick={() => handleUpdateStatus(order._id, 'preparing')}
                          className="w-full bg-[#0A422D] hover:bg-[#0A422D]/90 dark:bg-[#4ADE80] dark:hover:bg-[#4ADE80]/90 dark:text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 py-2.5 rounded-md cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          {t('kitchen.startCooking', 'Mulai Masak (Start)')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {pendingOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-md bg-white/30 dark:bg-zinc-900/10">
                  <ChefHat className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs font-bold">{t('kitchen.emptyNew', 'Tidak ada pesanan baru')}</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: PREPARING (Cooking) */}
          <div className="flex flex-col gap-4 bg-zinc-100/50 dark:bg-zinc-900/30 p-3 rounded-md border border-zinc-200/60 dark:border-zinc-800/40 h-full min-h-0">
            <div className="flex items-center justify-between bg-amber-500/10 dark:bg-amber-500/20 px-4 py-3 rounded-md border border-amber-500/20">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-450">
                <Flame className="h-4.5 w-4.5 animate-pulse" />
                <h2 className="font-black text-xs uppercase tracking-wider">{t('kitchen.cookingOrders', 'Sedang Dimasak (Cooking)')}</h2>
              </div>
              <Badge className="font-extrabold bg-amber-500 text-white rounded-md text-xs py-0.5 px-2">{preparingOrders.length}</Badge>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 custom-scrollbar pr-1">
              {preparingOrders.map(order => {
                const style = getCardStyle(order.createdAt, 'preparing');
                const isDineIn = order.orderType === 'dine_in';
                const isOnline = order.orderType === 'order_online';
                return (
                  <Card key={order._id} className={`${style.cardClass} shadow-none`}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800/60 pb-2.5">
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            {isDineIn ? (
                              <Armchair className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            ) : isOnline ? (
                              <Globe className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            ) : (
                              <ShoppingBag className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            )}
                            <h3 className={`font-black text-base ${style.headerText}`}>
                              {isDineIn ? order.tableNumber : (isOnline ? 'Online' : 'Take Away')}
                            </h3>
                          </div>
                          <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold uppercase mt-1">
                            #{order.receiptNumber} | {order.customerName}
                          </p>
                        </div>
                        <Badge variant="outline" className={`${style.timeBadge} flex items-center gap-1 text-[10px] py-0.5 px-2 rounded-md`}>
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{getElapsedTimeText(order.createdAt)}</span>
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2.5 py-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs border-b border-zinc-150/40 dark:border-zinc-850/40 pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-start gap-3 text-left w-full">
                              {item.product?.image && (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="h-10 w-10 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-extrabold text-zinc-900 dark:text-zinc-150 text-sm truncate">{item.product?.name || 'Unknown'}</p>
                                  <span className="font-black text-sm text-[#0A422D] dark:text-[#4ADE80] shrink-0">
                                    {item.quantity}x
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-450 capitalize mt-0.5">
                                  {t('kitchen.size', 'Ukuran')}: {item.size === 'small' ? t('kitchen.sizeSmall', 'kecil') : item.size === 'medium' ? t('kitchen.sizeMedium', 'sedang') : t('kitchen.sizeLarge', 'besar')}
                                  {item.notes && <span className="text-red-500 dark:text-red-400 font-bold"> - {t('kitchen.notes', 'Catatan')}: {item.notes}</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex justify-end">
                        <Button
                          size="lg"
                          onClick={() => handleUpdateStatus(order._id, 'ready')}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center justify-center gap-1.5 py-2.5 rounded-md cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t('kitchen.doneCooking', 'Selesai Masak (Done)')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {preparingOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-md bg-white/30 dark:bg-zinc-900/10">
                  <Flame className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs font-bold">{t('kitchen.emptyCooking', 'Tidak ada pesanan sedang dimasak')}</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: READY (Served/Ready for Delivery) */}
          <div className="flex flex-col gap-4 bg-zinc-100/50 dark:bg-zinc-900/30 p-3 rounded-md border border-zinc-200/60 dark:border-zinc-800/40 h-full min-h-0">
            <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-500/20 px-4 py-3 rounded-md border border-emerald-500/20">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-450">
                <Bell className="h-4.5 w-4.5" />
                <h2 className="font-black text-xs uppercase tracking-wider">{t('kitchen.readyOrders', 'Siap Saji (Ready)')}</h2>
              </div>
              <Badge className="font-extrabold bg-emerald-500 text-white rounded-md text-xs py-0.5 px-2">{readyOrders.length}</Badge>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 custom-scrollbar pr-1">
              {readyOrders.map(order => {
                const style = getCardStyle(order.createdAt, 'ready');
                const isDineIn = order.orderType === 'dine_in';
                const isOnline = order.orderType === 'order_online';
                return (
                  <Card key={order._id} className={`${style.cardClass} shadow-none `}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800/60 pb-2.5">
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            {isDineIn ? (
                              <Armchair className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            ) : isOnline ? (
                              <Globe className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            ) : (
                              <ShoppingBag className="h-4 w-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0" />
                            )}
                            <h3 className="font-black text-base text-emerald-700 dark:text-emerald-450">
                              {isDineIn ? order.tableNumber : (isOnline ? 'Online' : 'Take Away')}
                            </h3>
                          </div>
                          <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold uppercase mt-1">
                            #{order.receiptNumber} | {order.customerName}
                          </p>
                        </div>
                        <Badge variant="outline" className={`${style.timeBadge} flex items-center gap-1 text-[10px] py-0.5 px-2 rounded-md`}>
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{getElapsedTimeText(order.createdAt)}</span>
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2.5 py-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs border-b border-zinc-150/40 dark:border-zinc-850/40 pb-2 last:border-b-0 last:pb-0">
                            <div className="flex items-start gap-3 text-left w-full">
                              {item.product?.image && (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="h-10 w-10 rounded-md object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-extrabold text-zinc-900 dark:text-zinc-150 text-sm truncate">{item.product?.name || 'Unknown'}</p>
                                  <span className="font-black text-sm text-[#0A422D] dark:text-[#4ADE80] shrink-0">
                                    {item.quantity}x
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-450 capitalize mt-0.5">
                                  {t('kitchen.size', 'Ukuran')}: {item.size === 'small' ? t('kitchen.sizeSmall', 'kecil') : item.size === 'medium' ? t('kitchen.sizeMedium', 'sedang') : t('kitchen.sizeLarge', 'besar')}
                                  {item.notes && <span className="text-red-500 dark:text-red-400 font-bold"> - {t('kitchen.notes', 'Catatan')}: {item.notes}</span>}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex justify-end">
                        <Button
                          size="lg"
                          onClick={() => handleUpdateStatus(order._id, 'served')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 py-2.5 rounded-md cursor-pointer shadow-sm active:scale-[0.98] transition-all"
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          {t('kitchen.serve', 'Sajikan (Serve)')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {readyOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border border-dashed border-zinc-250 dark:border-zinc-800 rounded-md bg-white/30 dark:bg-zinc-900/10">
                  <Bell className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-xs font-bold">{t('kitchen.emptyReady', 'Tidak ada pesanan siap saji')}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

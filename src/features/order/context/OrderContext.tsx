import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import type { Product } from '../../menu/types';
import type { CartItem, OrderType, ItemSize, Transaction, HeldOrder } from '../types';
import { toast } from 'src/hooks/use-toast';
import { useTranslation } from '../../../hooks/useTranslation';
import api from '../../../api';

export interface POSNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'cancel' | 'order';
  read: boolean;
  date?: string;
  receiptNumber?: string;
  orderType?: string;
  items?: {
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
}

interface OrderContextProps {
  cart: CartItem[];
  orderType: OrderType;
  customerName: string;
  tableNumber: string;
  transactions: Transaction[];
  loadingTransactions: boolean;
  receiptNumber: string;
  isReportOpen: boolean;
  couponCode: string;
  discount: number;
  appliedCoupon: { code: string; type: string; value: number; discount: number; description: string } | null;
  activeShift: any | null;
  setIsReportOpen: (open: boolean) => void;
  setOrderType: (type: OrderType) => void;
  setCustomerName: (name: string) => void;
  setTableNumber: (table: string) => void;
  setCouponCode: (code: string) => void;
  applyCoupon: (subtotal: number) => Promise<boolean>;
  removeCoupon: () => void;
  setActiveShift: (shift: any | null) => void;
  addToCart: (product: Product, size?: ItemSize, notes?: string) => void;
  removeFromCart: (productId: string, size: ItemSize) => void;
  updateQuantity: (productId: string, size: ItemSize, delta: number) => void;
  updateItemNotes: (productId: string, size: ItemSize, notes: string) => void;
  updateItemSize: (productId: string, oldSize: ItemSize, newSize: ItemSize) => void;
  clearCart: () => void;
  placeOrder: (paymentMethod: 'cash' | 'card' | 'qris', amountPaid: number, change: number) => Promise<boolean>;
  notifications: POSNotification[];
  addNotification: (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'cancel' | 'order',
    items?: { name: string; quantity: number; price: number; image?: string }[],
    receiptNumber?: string,
    orderType?: string,
    notifSource?: 'pos' | 'admin' | 'all'
  ) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
  refreshNotifications: () => Promise<void>;
  addNotificationsBatch: (notifs: { title: string; message: string; type: string; items?: any[]; receiptNumber?: string; orderType?: string }[]) => Promise<void>;
  heldOrders: HeldOrder[];
  holdCurrentOrder: () => void;
  recallHeldOrder: (id: string) => void;
  deleteHeldOrder: (id: string) => void;
  cancelOrder: (receiptNumber: string) => Promise<boolean>;
  deleteOrder: (receiptNumber: string) => void;
  pendingTransactions: Transaction[];
  approvePayment: (transactionId: string) => Promise<boolean>;
}

const OrderContext = createContext<OrderContextProps | undefined>(undefined);

const generateReceiptNumber = () => {
  return 'GG-' + Math.floor(10000 + Math.random() * 90000).toString();
};

export const OrderProvider: React.FC<{ children: React.ReactNode; updateProductStock?: (id: string, qty: number) => void; source?: 'pos' | 'admin' }> = ({
  children,
  updateProductStock,
  source = 'all'
}) => {
  const { t } = useTranslation();
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [orderType, setOrderType] = useState<OrderType>(() => {
    try {
      return (localStorage.getItem('pos_orderType') as OrderType) || 'dine_in';
    } catch { return 'dine_in'; }
  });
  const [customerName, setCustomerName] = useState(() => {
    try {
      return localStorage.getItem('pos_customerName') || '';
    } catch { return ''; }
  });
  const [tableNumber, setTableNumber] = useState(() => {
    try {
      return localStorage.getItem('pos_tableNumber') || 'B12 - Indoor';
    } catch { return 'B12 - Indoor'; }
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number; discount: number; description: string } | null>(null);
  const [activeShift, setActiveShift] = useState<any | null>(null);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>(() => {
    try {
      const saved = localStorage.getItem('pos_heldOrders');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [notifications, setNotifications] = useState<POSNotification[]>([]);
  const isInitializedRef = useRef(false);
  const notificationsRef = useRef<POSNotification[]>([]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.08, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      // Pleasant double bell chime
      playNote(1318.51, audioCtx.currentTime, 0.15); // E6
      playNote(1760.00, audioCtx.currentTime + 0.1, 0.35); // A6
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('pos_orderType', orderType);
  }, [orderType]);

  useEffect(() => {
    localStorage.setItem('pos_customerName', customerName);
  }, [customerName]);

  useEffect(() => {
    localStorage.setItem('pos_tableNumber', tableNumber);
  }, [tableNumber]);

  useEffect(() => {
    localStorage.setItem('pos_heldOrders', JSON.stringify(heldOrders));
  }, [heldOrders]);

  const fetchNotifications = async () => {
    try {
      const params = source !== 'all' ? { source } : {};
      const response = await api.get('/notifications', { params });
      if (response.data.success) {
        const fetchedNotifs = response.data.data.map((n: any) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          time: getTimeAgo(n.createdAt),
          type: n.type,
          read: n.read,
          date: new Date(n.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) + ', ' + new Date(n.createdAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          receiptNumber: n.receiptNumber,
          orderType: n.orderType,
          items: n.items,
        }));

        if (isInitializedRef.current) {
          const existingIds = new Set(notificationsRef.current.map(n => n.id));
          const newNotifs = fetchedNotifs.filter((n: any) => !existingIds.has(n.id));

          if (newNotifs.length > 0) {
            newNotifs.slice(0, 3).forEach((n: any) => {
              toast({
                title: n.title,
                description: n.message,
                variant: n.type === 'cancel' || n.type === 'warning' ? 'destructive' : 'default',
              });
            });
            playNotificationSound();

            // Refresh transactions when a new order notification is detected via polling
            if (newNotifs.some((n: any) => n.type === 'order')) {
              fetchTransactionsRef.current?.();
            }
          }
        } else {
          isInitializedRef.current = true;
        }

        setNotifications(fetchedNotifs);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let baseURL = api.defaults.baseURL || '';
    if (!baseURL.startsWith('http') && !baseURL.startsWith('/')) {
      baseURL = '/' + baseURL;
    }
    if (!baseURL.startsWith('http')) {
      baseURL = window.location.origin + baseURL;
    }
    
    const streamURL = `${baseURL}/notifications/stream?token=${token}`;
    let eventSource: EventSource | null = null;
    let retryTimeout: any;

    const connectSSE = () => {
      eventSource = new EventSource(streamURL);

      eventSource.onmessage = (event) => {
        try {
          const n = JSON.parse(event.data);
          
          const newNotif: POSNotification = {
            id: n._id || n.id,
            title: n.title,
            message: n.message,
            time: 'Just now',
            type: n.type,
            read: n.read || false,
            date: new Date(n.createdAt || new Date()).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }) + ', ' + new Date(n.createdAt || new Date()).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }),
            receiptNumber: n.receiptNumber,
            orderType: n.orderType,
            items: n.items,
          };

          const matchesSource = source === 'all' || newNotif.source === 'all' || newNotif.source === source || n.source === 'all' || n.source === source;

          if (matchesSource) {
            setNotifications((prev) => {
              if (prev.some(existing => existing.id === newNotif.id)) return prev;
              
              toast({
                title: newNotif.title,
                description: newNotif.message,
                variant: newNotif.type === 'cancel' || newNotif.type === 'warning' ? 'destructive' : 'default',
              });
              playNotificationSound();
              
              return [newNotif, ...prev];
            });

            // Refresh transactions when a new order notification arrives (self-order or POS order)
            if (newNotif.type === 'order') {
              fetchTransactionsRef.current?.();
            }
          }
        } catch (err) {
          console.error('Error parsing SSE notification:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn('EventSource failed, closing and retrying in 10s...', err);
        if (eventSource) {
          eventSource.close();
        }
        retryTimeout = setTimeout(connectSSE, 10000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(retryTimeout);
    };
  }, [source]);

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  };

  const addNotification = async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'cancel' | 'order',
    items?: { name: string; quantity: number; price: number; image?: string }[],
    receiptNumber?: string,
    orderType?: string,
    notifSource?: 'pos' | 'admin' | 'all'
  ) => {
    try {
      const response = await api.post('/notifications', { title, message, type, items, receiptNumber, orderType, source: notifSource || source });
      if (response.data.success) {
        const n = response.data.data;
        const newNotif: POSNotification = {
          id: n._id,
          title: n.title,
          message: n.message,
          time: 'Just now',
          type: n.type,
          read: n.read || false,
          date: new Date(n.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) + ', ' + new Date(n.createdAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          receiptNumber: n.receiptNumber,
          orderType: n.orderType,
          items: n.items,
        };
        setNotifications((prev) => {
          if (prev.some(existing => existing.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      }
    } catch (error) {
      console.error('Failed to save notification', error);
    }
  };

  const addNotificationsBatch = async (
    notifs: { title: string; message: string; type: string; items?: any[]; receiptNumber?: string; orderType?: string }[]
  ) => {
    try {
      if (notifs.length === 0) return;
      const response = await api.post('/notifications/batch', { notifications: notifs.map(n => ({ ...n, source })) });
      if (response.data.success && Array.isArray(response.data.data)) {
        const newNotifs: POSNotification[] = response.data.data.map((n: any) => ({
          id: n._id,
          title: n.title,
          message: n.message,
          time: 'Just now',
          type: n.type,
          read: n.read || false,
          date: new Date(n.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }) + ', ' + new Date(n.createdAt).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          receiptNumber: n.receiptNumber,
          orderType: n.orderType,
          items: n.items,
        }));
        setNotifications((prev) => {
          const filtered = newNotifs.filter(n => !prev.some(existing => existing.id === n.id));
          return [...filtered, ...prev];
        });
      }
    } catch (error) {
      console.error('Failed to save notifications batch', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const params = source !== 'all' ? { source } : {};
      await api.put('/notifications/read-all', {}, { params });
    } catch (error) {
      console.error('Failed to mark all as read', error);
      fetchNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const params = source !== 'all' ? { source } : {};
      await api.delete('/notifications', { params });
      setNotifications([]);
    } catch (error) {
      console.error('Failed to delete all notifications', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      if (source !== 'admin' && !activeShift) {
        setTransactions([]);
        setLoadingTransactions(false);
        return;
      }
      const params = source === 'admin' ? {} : { shift: activeShift._id };
      const response = await api.get('/transactions', { params });
      if (response.data.success) {
        setTransactions(response.data.data.map((tx: any) => ({
          _id: tx._id,
          id: tx.receiptNumber,
          items: tx.items.map((i: any) => ({
            product: {
              id: i.product?._id || 'unknown',
              name: i.product?.name || 'Unknown Product',
              price: i.product?.price || 0,
              image: i.product?.image || '',
              category: i.product?.category || 'uncategorized',
              available: true,
              stockCount: 0
            },
            quantity: i.quantity,
            size: i.size,
            notes: i.notes
          })),
          subtotal: tx.subtotal,
          tax: tx.tax,
          total: tx.total,
          orderType: tx.orderType,
          customerName: tx.customerName,
          tableNumber: tx.tableNumber || 'N/A',
          timestamp: new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(tx.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          paymentMethod: tx.paymentMethod,
          amountPaid: tx.amountPaid,
          change: tx.change,
          status: tx.status,
          cancelReason: tx.cancelReason || '',
          couponCode: tx.couponCode || '',
          discount: tx.discount || 0,
          shift: tx.shift,
          createdAt: tx.createdAt,
        })));
      }
    } catch (error) {
      console.error('Failed to fetch transactions', error);
    } finally {
      setLoadingTransactions(false);
    }
  };
  const fetchTransactionsRef = useRef(fetchTransactions);
  fetchTransactionsRef.current = fetchTransactions;

  // Initialize and check active shift
  useEffect(() => {
    setReceiptNumber(generateReceiptNumber());
    fetchTransactions();
    
    const checkActiveShift = () => {
      api.get('/shifts/active').then((res) => {
        if (res.data.success) {
          // If we had an active shift, but now the server says there is none (auto-closed)
          if (activeShift && !res.data.data) {
            setActiveShift(null);
            clearCart();
            toast({
              title: t('notifications.shiftEndedTitle', 'Shift Ended'),
              description: t('notifications.shiftEndedAutoDesc', 'Your shift has been automatically ended because operational hours have ended.'),
              variant: 'warning',
            });
          } else if (res.data.data) {
            setActiveShift(res.data.data);
          }
        }
      }).catch(() => {});
    };

    checkActiveShift();

    // Check active shift status periodically (every 60 seconds)
    const interval = setInterval(checkActiveShift, 60000);
    return () => clearInterval(interval);
  }, [activeShift?._id]);

  // Refetch transactions when active shift changes
  useEffect(() => {
    fetchTransactions();
  }, [activeShift?._id]);

  // Periodic poll to keep transactions in sync (catches missed SSE/polling triggers)
  useEffect(() => {
    if (!activeShift) return;
    const interval = setInterval(() => {
      fetchTransactionsRef.current?.();
    }, 15000);
    return () => clearInterval(interval);
  }, [activeShift?._id]);


  const addToCart = (product: Product, size: ItemSize = 'medium', notes: string = 'Less Sugar') => {
    if (!product.available || product.stockCount <= 0) return;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.size === size
      );

      if (existingItemIndex > -1) {
        const newCart = [...prevCart];
        const item = newCart[existingItemIndex];
        // Check if quantity exceeds stock
        if (item.quantity < product.stockCount) {
          newCart[existingItemIndex] = {
            ...item,
            quantity: item.quantity + 1,
          };
        }
        return newCart;
      } else {
        return [...prevCart, { product, quantity: 1, size, notes }];
      }
    });
  };

  const removeFromCart = (productId: string, size: ItemSize) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.product.id === productId && item.size === size))
    );
  };

  const updateQuantity = (productId: string, size: ItemSize, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId && item.size === size) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stockCount) return item; // limit to stock
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null);
    });
  };

  const updateItemNotes = (productId: string, size: ItemSize, notes: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId && item.size === size
          ? { ...item, notes }
          : item
      )
    );
  };

  const updateItemSize = (productId: string, oldSize: ItemSize, newSize: ItemSize) => {
    setCart((prevCart) => {
      // Find item with old size
      const oldIndex = prevCart.findIndex(
        (item) => item.product.id === productId && item.size === oldSize
      );
      if (oldIndex === -1) return prevCart;

      const newCart = [...prevCart];
      const targetItem = newCart[oldIndex];

      // Check if item with new size already exists in cart
      const targetExistsIndex = prevCart.findIndex(
        (item) => item.product.id === productId && item.size === newSize
      );

      if (targetExistsIndex > -1 && targetExistsIndex !== oldIndex) {
        // Merge them
        const existingItem = newCart[targetExistsIndex];
        const mergedQty = Math.min(targetItem.product.stockCount, existingItem.quantity + targetItem.quantity);

        newCart[targetExistsIndex] = {
          ...existingItem,
          quantity: mergedQty,
        };
        // Remove the old item
        return newCart.filter((_, idx) => idx !== oldIndex);
      } else {
        // Change size
        newCart[oldIndex] = {
          ...targetItem,
          size: newSize,
        };
        return newCart;
      }
    });
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon(null);
    localStorage.removeItem('pos_cart');
  };

  const applyCoupon = async (subtotal: number): Promise<boolean> => {
    try {
      const response = await api.post('/coupons/validate', { code: couponCode, subtotal });
      if (response.data.success) {
        const couponData = response.data.data;
        setDiscount(couponData.discount);
        setAppliedCoupon(couponData);
        toast({
          title: t('notifications.couponAppliedTitle', 'Coupon Applied'),
          description: `Discount: Rp ${couponData.discount.toLocaleString()}`,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to validate coupon';
      setDiscount(0);
      setAppliedCoupon(null);
      toast({
        title: t('notifications.errorTitle', 'Error'),
        description: message,
        variant: 'error',
      });
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon(null);
  };

  const holdCurrentOrder = () => {
    if (cart.length === 0) {
      toast({
        title: t('notifications.emptyCartTitle', 'Empty Cart'),
        description: t('notifications.emptyCartDesc', 'Cannot hold an empty cart.'),
        variant: 'error',
      });
      return;
    }

    const subtotalVal = cart.reduce((sum, item) => {
      const sizePriceModifier = item.size === 'small' ? -2000 : item.size === 'large' ? 5000 : 0;
      return sum + (item.product.price + sizePriceModifier) * item.quantity;
    }, 0);
    const taxVal = Math.round(subtotalVal * 0.1);
    const totalVal = subtotalVal + taxVal;

    const newHeld: HeldOrder = {
      id: `hold-${Date.now()}`,
      cart: [...cart],
      customerName: customerName || 'Walk-in Customer',
      tableNumber: orderType === 'dine_in' ? tableNumber : 'N/A',
      orderType,
      total: totalVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setHeldOrders((prev) => [newHeld, ...prev]);
    clearCart();
    toast({
      title: t('notifications.orderHeldTitle', 'Order Held'),
      description: t('notifications.orderHeldDesc', { name: newHeld.customerName })
    });
  };

  const recallHeldOrder = (id: string) => {
    const target = heldOrders.find((order) => order.id === id);
    if (!target) return;

    setCart(target.cart);
    setCustomerName(target.customerName);
    setTableNumber(target.tableNumber);
    setOrderType(target.orderType);

    setHeldOrders((prev) => prev.filter((order) => order.id !== id));
    toast({
      title: t('notifications.draftRestoredTitle', 'Draft Restored'),
      description: t('notifications.draftRestoredDesc', { name: target.customerName })
    });
  };

  const deleteHeldOrder = (id: string) => {
    const target = heldOrders.find((order) => order.id === id);
    if (!target) return;

    setHeldOrders((prev) => prev.filter((order) => order.id !== id));
    toast({
      title: t('notifications.heldOrderDeletedTitle', 'Held Order Deleted'),
      description: t('notifications.heldOrderDeletedDesc', { name: target.customerName })
    });
  };

  const cancelOrder = async (receiptNum: string) => {
    const txIndex = transactions.findIndex((tx) => tx.id === receiptNum);
    if (txIndex === -1) return false;

    const tx = transactions[txIndex];
    if (tx.status === 'cancelled') {
      toast({
        title: t('notifications.errorTitle', 'Error'),
        description: t('notifications.alreadyCancelled', 'This transaction is already cancelled.'),
        variant: 'error',
      });
      return false;
    }

    // Optimistic update
    setTransactions((prev) =>
      prev.map((t) => (t.id === receiptNum ? { ...t, status: 'cancelled' } : t))
    );

    try {
      const response = await api.put(`/transactions/${tx._id || tx.id}/cancel`);
      
      if (response.data.success) {
        await fetchNotifications();
        toast({
          title: t('notifications.orderCancelledTitle', 'Order Cancelled'),
          description: t('notifications.orderCancelledDesc', { receiptNumber: receiptNum })
        });
        return true;
      }
      return false;
    } catch (error) {
      // Revert optimistic update on failure
      setTransactions((prev) =>
        prev.map((t) => (t.id === receiptNum ? { ...t, status: 'completed' } : t))
      );
      console.error('Error cancelling order', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel the order. Please try again.',
        variant: 'error',
      });
      return false;
    }
  };

  const deleteOrder = async (receiptNum: string) => {
    const tx = transactions.find((t) => t.id === receiptNum);
    if (!tx) return false;

    // Optimistic update
    setTransactions((prev) => prev.filter((t) => t.id !== receiptNum));

    try {
      const response = await api.delete(`/transactions/${tx._id}`);
      if (response.data.success) {
        toast({
          title: 'Order Deleted',
          description: `Order #${receiptNum} has been permanently deleted.`
        });
        return true;
      }
      return false;
    } catch (error) {
      // Revert optimistic update on failure
      setTransactions((prev) => [tx, ...prev]);
      console.error('Error deleting order', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the order. Please try again.',
        variant: 'error',
      });
      return false;
    }
  };

  const pendingTransactions = useMemo(() => {
    return transactions.filter(tx => tx.status === 'pending');
  }, [transactions]);

  const approvePayment = async (transactionId: string) => {
    try {
      const response = await api.put(`/transactions/${transactionId}/approve`);
      if (response.data.success) {
        setTransactions((prev) =>
          prev.map((t) =>
            t._id === transactionId ? { ...t, status: 'completed', amountPaid: t.total, change: 0 } : t
          )
        );
        toast({
          title: t('pos.paymentApproved', 'Payment Approved'),
          description: t('pos.paymentApprovedDesc', 'Cash payment has been approved. Kitchen can proceed.'),
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error approving payment', error);
      toast({
        title: t('notifications.errorTitle', 'Error'),
        description: error.response?.data?.message || 'Failed to approve payment',
        variant: 'error',
      });
      return false;
    }
  };

  const placeOrder = async (paymentMethod: 'cash' | 'card' | 'qris', amountPaid: number, change: number) => {
    if (cart.length === 0) return false;

    const subtotalVal = cart.reduce((sum, item) => {
      const sizePriceModifier = item.size === 'small' ? -2000 : item.size === 'large' ? 5000 : 0;
      return sum + (item.product.price + sizePriceModifier) * item.quantity;
    }, 0);
    const taxVal = Math.round(subtotalVal * 0.1);
    const totalVal = subtotalVal + taxVal - discount;

    try {
      const orderPayload = {
        items: cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          size: item.size,
          notes: item.notes
        })),
        subtotal: subtotalVal,
        tax: taxVal,
        total: totalVal,
        orderType,
        customerName: customerName || 'Walk-in Customer',
        tableNumber: orderType === 'dine_in' ? tableNumber : 'N/A',
        paymentMethod,
        amountPaid,
        change,
        couponCode: appliedCoupon?.code || '',
        discount,
        shiftId: activeShift?._id || null,
      };

      const response = await api.post('/transactions', orderPayload);

      if (response.data.success) {
        const savedTransaction = response.data.data;
        
        // Map backend response to frontend model
        const newTransaction: Transaction = {
          _id: savedTransaction._id,
          id: savedTransaction.receiptNumber,
          items: [...cart], // Use cart for full product details
          subtotal: savedTransaction.subtotal,
          tax: savedTransaction.tax,
          total: savedTransaction.total,
          orderType: savedTransaction.orderType,
          customerName: savedTransaction.customerName,
          tableNumber: savedTransaction.tableNumber || 'N/A',
          timestamp: new Date(savedTransaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(savedTransaction.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          paymentMethod: savedTransaction.paymentMethod,
          amountPaid: savedTransaction.amountPaid,
          change: savedTransaction.change,
          status: savedTransaction.status,
          createdAt: savedTransaction.createdAt,
        };

        // Update product stock counts if callback is provided
        if (updateProductStock) {
          cart.forEach((item) => {
            updateProductStock(item.product.id, item.quantity);
          });
        }

        // Refresh notifications from backend (backend already created them in createTransaction)
        await fetchNotifications();

        setTransactions((prev) => [newTransaction, ...prev]);
        clearCart();
        setReceiptNumber(generateReceiptNumber());
        toast({
          title: t('notifications.orderCreatedTitle', 'Order successfully created'),
          description: t('notifications.orderCreatedDesc', { receiptNumber: savedTransaction.receiptNumber })
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error placing order', error);
      toast({
        title: 'Error',
        description: 'Failed to place the order. Please try again.',
        variant: 'error',
      });
      return false;
    }
  };

  return (
    <OrderContext.Provider
      value={{
        cart,
        orderType,
        customerName,
        tableNumber,
        transactions,
        loadingTransactions,
        receiptNumber,
        isReportOpen,
        couponCode,
        discount,
        appliedCoupon,
        activeShift,
        setIsReportOpen,
        setOrderType,
        setCustomerName,
        setTableNumber,
        setCouponCode,
        applyCoupon,
        removeCoupon,
        setActiveShift,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNotes,
        updateItemSize,
        clearCart,
        placeOrder,
        notifications,
        addNotification,
        markAllAsRead,
        markAsRead,
        deleteNotification,
        deleteAllNotifications,
        refreshNotifications: fetchNotifications,
        addNotificationsBatch,
        heldOrders,
        holdCurrentOrder,
        recallHeldOrder,
        deleteHeldOrder,
        cancelOrder,
        deleteOrder,
        pendingTransactions,
        approvePayment,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

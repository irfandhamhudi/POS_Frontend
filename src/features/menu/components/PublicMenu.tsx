import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from 'src/api';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'src/components/ui/dialog';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Coffee,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Globe,
  Sun,
  Moon,
  Trash2,
  ReceiptText
} from 'lucide-react';
import { formatCurrency } from 'src/lib/utils';
import { useTranslation } from 'src/hooks/useTranslation';
import { OrderStatusTracker } from './OrderStatusTracker';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  stockCount: number;
}

interface Category {
  id: string;
  name: string;
  available: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  size: 'small' | 'medium' | 'large';
  notes: string;
}

export const PublicMenu: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Table info from QR query e.g. /menu?table=Meja%2003
  const tableParam = searchParams.get('table') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customizer modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customSize, setCustomSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [customNotes, setCustomNotes] = useState('');
  const [customQty, setCustomQty] = useState(1);

  // Checkout info
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState(() => {
    return searchParams.get('table') || localStorage.getItem('customer_table') || '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [closedReason, setClosedReason] = useState<'hours' | 'no_shift' | null>(null);
  const [operatingHours, setOperatingHours] = useState<{ openHour: number; closeHour: number } | null>(null);
  const [placedOrders, setPlacedOrders] = useState<string[]>([]);
  const [isViewOrdersOpen, setIsViewOrdersOpen] = useState(false);
  const [activeTrackingReceipt, setActiveTrackingReceipt] = useState<string | null>(null);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
  }>({
    isOpen: false,
    message: '',
    title: ''
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('placed_orders') || '[]');
      setPlacedOrders(saved);
    } catch {
      setPlacedOrders([]);
    }
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('table') || '';
    if (fromUrl) {
      localStorage.setItem('customer_table', fromUrl);
      setTableNumber(fromUrl);
    }
  }, [searchParams]);

  const { i18n, currentLanguage } = useTranslation();
  const isId = currentLanguage === 'id';

  const showAlert = (message: string, title?: string) => {
    setAlertDialog({
      isOpen: true,
      message,
      title: title || (isId ? 'Pemberitahuan' : 'Notification')
    });
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('public_theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return true; // Default to dark mode for public menu
  });

  useEffect(() => {
    localStorage.setItem('public_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);



  const handleLanguageChange = (lang: 'en' | 'id') => {
    i18n.changeLanguage(lang);
  };

  // Fetch Menu Data
  useEffect(() => {
    const fetchMenuData = async () => {
      setLoading(true);
      try {
        const [prodRes, catRes, shiftRes, settingsRes] = await Promise.all([
          api.get('/products/public'),
          api.get('/categories/public'),
          api.get('/shifts/public/active'),
          api.get('/shifts/settings')
        ]);

        let outsideHours = false;
        if (settingsRes.data?.success) {
          const { openHour, closeHour, now } = settingsRes.data.data;
          setOperatingHours({ openHour, closeHour });
          // closeHour=24 means 24-hour operation — never lock based on hours
          if (closeHour !== 24 && (now < openHour || now >= closeHour)) {
            outsideHours = true;
            setIsOpen(false);
            setClosedReason('hours');
          }
        }

        // Only check shift status if we're within operating hours
        if (!outsideHours && shiftRes.data?.success) {
          if (!shiftRes.data.active) {
            setIsOpen(false);
            setClosedReason('no_shift');
          } else {
            setIsOpen(true);
          }
        }
        if (prodRes.data.success) {
          setProducts(prodRes.data.data.filter((p: Product) => p.available));
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data);
        }
      } catch (err: any) {
        console.error('Fetch Menu Error:', err);
        setError('Gagal memuat daftar menu. Silakan segarkan halaman.');
      } finally {
        setLoading(false);
      }
    };
    fetchMenuData();
  }, []);

  // Handle open customizer modal
  const openCustomizer = (product: Product) => {
    if (product.stockCount <= 0) {
      showAlert(
        isId ? 'Maaf, item ini sedang habis.' : 'Sorry, this item is currently out of stock.',
        isId ? 'Stok Habis' : 'Out of Stock'
      );
      return;
    }
    setSelectedProduct(product);
    setCustomSize('medium');
    setCustomNotes('');
    setCustomQty(1);
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    if (selectedProduct.stockCount <= 0) return;

    const existingIndex = cart.findIndex(
      item => item.product._id === selectedProduct._id &&
        item.size === customSize &&
        item.notes === customNotes
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += customQty;
      setCart(updated);
    } else {
      setCart([...cart, {
        product: selectedProduct,
        quantity: customQty,
        size: customSize,
        notes: customNotes
      }]);
    }

    setSelectedProduct(null);
  };

  // Cart operations
  const updateQty = (index: number, change: number) => {
    const updated = [...cart];
    updated[index].quantity += change;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      return sum + item.product.price * item.quantity;
    }, 0);
  }, [cart]);

  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Checkout process for public orders (Cash payment only)
  const handleCheckout = async () => {
    if (!customerName.trim()) {
      showAlert(isId ? 'Silakan masukkan nama Anda.' : 'Please enter your name.');
      return;
    }
    if (!tableNumber.trim()) {
      showAlert(isId ? 'Silakan tentukan nomor meja.' : 'Please select your table.');
      return;
    }
    if (cart.length === 0) {
      showAlert(isId ? 'Keranjang belanja kosong.' : 'Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          size: item.size,
          notes: item.notes
        })),
        orderType: 'dine_in',
        customerName,
        tableNumber,
        paymentMethod: 'cash',
        discount: 0,
        couponCode: ''
      };

      const response = await api.post('/transactions/public', payload);

      if (response.data.success) {
        const { receiptNumber } = response.data.data;

        try {
          const savedOrders = JSON.parse(localStorage.getItem('placed_orders') || '[]');
          if (!savedOrders.includes(receiptNumber)) {
            const updatedOrders = [...savedOrders, receiptNumber];
            localStorage.setItem('placed_orders', JSON.stringify(updatedOrders));
            setPlacedOrders(updatedOrders);
          }
        } catch (e) {
          console.error('Error saving placed order:', e);
        }

        setCart([]);
        setIsCartOpen(false);
        setActiveTrackingReceipt(receiptNumber);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      showAlert(err.response?.data?.message || (isId ? 'Gagal memproses pesanan. Silakan coba lagi.' : 'Failed to process order. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePlacedOrder = (receiptNum: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the tracking view modal
    const updated = placedOrders.filter((num) => num !== receiptNum);
    setPlacedOrders(updated);
    localStorage.setItem('placed_orders', JSON.stringify(updated));
  };

  // const clearAllPlacedOrders = () => {
  //   setPlacedOrders([]);
  //   localStorage.removeItem('placed_orders');
  //   setIsViewOrdersOpen(false);
  // };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-white">
        <Coffee className="h-10 w-10 text-[#4ADE80] animate-bounce mb-3" />
        <p className="text-zinc-400 text-sm font-medium animate-pulse">Menyiapkan Menu Digital...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-white text-center gap-3">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-sm font-bold">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white font-bold text-xs mt-2">
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (!isOpen) {
    const isOutsideHours = closedReason === 'hours' && operatingHours;
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-zinc-50 text-zinc-900'} p-6 text-center gap-5`}>
        <div className="size-20 bg-[#4ADE80]/10 rounded-full flex items-center justify-center text-[#4ADE80] ">
          <Coffee className="h-10 w-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-black">{isId ? "Restoran Sedang Tutup" : "Restaurant is Closed"}</h2>
          <p className="text-[13px] text-zinc-550 dark:text-zinc-400 max-w-xs leading-relaxed">
            {isOutsideHours
              ? (isId
                ? `Maaf, kami sedang tutup. Jam operasional kami adalah ${operatingHours!.openHour}:00 - ${operatingHours!.closeHour}:00.`
                : `Sorry, we're closed right now. Our operating hours are ${operatingHours!.openHour}:00 - ${operatingHours!.closeHour}:00.`)
              : (isId
                ? "Maaf, saat ini kami belum menerima pesanan mandiri. Jam operasional sistem belum dimulai karena kasir belum melakukan Clock-In (Shift Aktif)."
                : "Sorry, we are currently not accepting self-orders. System operating hours have not started because the cashier has not clocked in yet (No Active Shift).")}
          </p>
        </div>
        <Button size='lg' onClick={() => window.location.reload()} className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white font-bold text-xs mt-2 px-6 rounded-md">
          {isId ? "Segarkan Halaman" : "Refresh Page"}
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'} font-sans pb-24 md:pb-6 max-w-md mx-auto relative border-x border-zinc-200 dark:border-zinc-800 shadow-2xl`}>
      {/* Top Banner / Brand */}
      <div className={`relative h-44 bg-linear-to-br ${isDarkMode ? 'from-[#06261b] to-zinc-950 border-zinc-900' : 'from-[#EAF7F2] to-white border-zinc-200'} p-6 flex flex-col justify-end overflow-hidden border-b`}>
        {/* Floating Theme, Language, and View Order controls in top right */}
        <div className={`absolute top-4 right-4 flex items-center gap-2 z-10 ${isDarkMode ? 'bg-black/35 border-white/10 shadow-black/30' : 'bg-white/85 border-zinc-205 shadow-zinc-200/50'} backdrop-blur-md px-2 py-1.5 rounded-md border shadow-lg transition-all`}>
          {/* View Placed Orders Button */}
          {placedOrders.length > 0 && (
            <button
              onClick={() => setIsViewOrdersOpen(true)}
              className={`p-1.5 rounded-md border transition-all cursor-pointer ${isDarkMode
                ? 'bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300 hover:text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 hover:text-zinc-950'
                }`}
              title={isId ? "Lihat Pesanan Saya" : "View My Orders"}
            >
              <ReceiptText className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Language Selector */}
          <button
            onClick={() => handleLanguageChange(currentLanguage === 'en' ? 'id' : 'en')}
            className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-1.5 rounded-md border transition-all cursor-pointer ${isDarkMode
              ? 'bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300 hover:text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 hover:text-zinc-950'
              }`}
          >
            <Globe className="h-3.5 w-3.5" />
            {currentLanguage.toUpperCase()}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-md border transition-all cursor-pointer ${isDarkMode
              ? 'bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300 hover:text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 hover:text-zinc-950'
              }`}
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0A422D]/10 rounded-full blur-3xl -z-1"></div>
        <div className={`flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full w-fit border transition-colors ${isDarkMode
          ? 'text-[#4ADE80] bg-[#0A422D]/30 border-[#0A422D]/50'
          : 'text-[#0A422D] bg-[#0A422D]/10 border-[#0A422D]/25'
          }`}>
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black tracking-wider uppercase">{isId ? "Menu Digital Cafe" : "Digital Cafe Menu"}</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight leading-none text-zinc-900 dark:text-white">Green Grounds Coffee</h1>
        <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1">
          {tableParam
            ? `${isId ? "Memesan untuk Meja" : "Ordering for Table"}: ${tableParam}`
            : (isId ? "Silakan pilih menu favorit Anda" : "Please select your favorite menu")}
        </p>
      </div>

      {/* Main Container */}
      <div className="p-4 flex flex-col gap-4">

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <Input
            type="text"
            placeholder={isId ? "Cari makanan atau kopi..." : "Search food or coffee..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 text-sm rounded-md focus:border-[#4ADE80] placeholder-zinc-400 dark:placeholder-zinc-500 text-zinc-900 dark:text-white"
          />
        </div>

        {/* Categories Tab Bar */}
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-md overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === 'all'
              ? 'bg-[#0A422D] text-white shadow-sm'
              : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
          >
            {isId ? "Semua Menu" : "All Menu"}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === cat.id
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 gap-3.5 mt-2">
          {filteredProducts.map((p) => (
            <div
              key={p._id}
              onClick={() => openCustomizer(p)}
              className={`bg-white dark:bg-zinc-900/80 border border-zinc-205 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/50 rounded-md overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all shadow-sm ${p.stockCount <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="relative h-32 w-full bg-zinc-150 dark:bg-zinc-950 overflow-hidden flex items-center justify-center rounded-t-md">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <Coffee className="h-10 w-10 text-zinc-450 dark:text-zinc-800" />
                )}
                {p.stockCount <= 3 && p.stockCount > 0 && (
                  <Badge variant="destructive" className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-md font-black">
                    {isId ? `Sisa ${p.stockCount}` : `Only ${p.stockCount} left`}
                  </Badge>
                )}
                {p.stockCount <= 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-md">
                    <span className="text-white font-black text-xs tracking-wider uppercase">{isId ? 'Habis' : 'Out of Stock'}</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col justify-between flex-1 gap-2.5">
                <div>
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-white line-clamp-2 text-left">{p.name}</h3>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-extrabold text-[#4ADE80]">{formatCurrency(p.price)}</span>
                  <div className="h-6 w-6 rounded-md bg-[#0A422D] flex items-center justify-center text-[#4ADE80] hover:bg-[#4ADE80] hover:text-zinc-950 transition-colors">
                    <Plus className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-zinc-500 text-sm">
            Tidak ada produk ditemukan
          </div>
        )}
      </div>

      {/* Floating Cart Button (when items are in cart) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full h-14 bg-[#4ADE80] hover:bg-[#3ec473] text-zinc-950 rounded-md shadow-xl flex items-center justify-between px-5 font-black text-xs transition-transform active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative bg-zinc-950/15 p-2 rounded-md">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] h-4 w-4 rounded-full flex items-center justify-center font-bold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="text-left">
                <p className="font-extrabold text-sm text-zinc-955 leading-none">{isId ? "Lihat Keranjang" : "View Cart"}</p>
                <p className="text-[10px] text-zinc-800 font-bold mt-0.5">{cart.length} {isId ? "Jenis Menu" : "Items"}</p>
              </div>
            </div>
            <span className="text-base font-black">{formatCurrency(total)}</span>
          </button>
        </div>
      )}

      {/* Customizer Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className={`max-w-87.5 ${isDarkMode ? 'dark bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'} rounded-md p-6 text-left shadow-2xl`}>
          {selectedProduct && (
            <div className="flex flex-col gap-4">
              <DialogHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <DialogTitle className="text-base font-black text-zinc-900 dark:text-white">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="text-xs text-zinc-550 dark:text-zinc-400 mt-1 block">
                  {isId ? "Kustomisasi ukuran dan tambahkan catatan rasa" : "Customize size and add taste notes"}
                </DialogDescription>
              </DialogHeader>

              {/* Sizing Options */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{isId ? "Ukuran Porsi" : "Portion Size"}</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => {
                    return (
                      <button
                        key={size}
                        onClick={() => setCustomSize(size)}
                        className={`py-2.5 rounded-md border text-xs font-bold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all ${customSize === size
                          ? 'border-[#4ADE80] bg-[#4ADE80]/5 text-[#4ADE80]'
                          : 'border-zinc-205 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-900'
                          }`}
                      >
                        <span className="capitalize">{size === 'small' ? (isId ? 'kecil' : 'small') : size === 'medium' ? (isId ? 'sedang' : 'medium') : (isId ? 'besar' : 'large')}</span>
                        <span className="text-[9px] font-black text-[#4ADE80] uppercase tracking-wide">{isId ? "Gratis" : "Free"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions (Notes) */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{isId ? "Catatan Khusus" : "Special Instructions"}</span>
                <Input
                  type="text"
                  placeholder={isId ? "Contoh: Less ice, extra sugar, dll." : "Example: Less ice, extra sugar, etc."}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="bg-zinc-105 dark:bg-zinc-950 border-zinc-205 dark:border-zinc-800 h-10 text-xs rounded-md focus:border-[#4ADE80] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-650"
                />
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase">{isId ? "Harga Satuan" : "Unit Price"}</span>
                  <span className="text-base font-black text-[#4ADE80]">
                    {formatCurrency(selectedProduct.price)}
                  </span>
                </div>

                <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 p-1 rounded-md">
                  <button
                    onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                    className="h-8 w-8 rounded-md bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-extrabold text-sm min-w-4 text-center">{customQty}</span>
                  <button
                    onClick={() => setCustomQty(customQty + 1)}
                    className="h-8 w-8 rounded-md bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full h-11 bg-[#4ADE80] hover:bg-[#3ec473] text-zinc-950 font-black text-xs rounded-md mt-2 cursor-pointer"
              >
                {isId ? "Masukkan Keranjang" : "Add to Cart"} - {formatCurrency(selectedProduct.price * customQty)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer & Checkout Info */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className={`max-w-87.5 ${isDarkMode ? 'dark bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'} rounded-md p-6 text-left shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar`}>
          <DialogHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <DialogTitle className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#4ADE80]" />
              {isId ? "Detail Keranjang Belanja" : "Shopping Cart Details"}
            </DialogTitle>
          </DialogHeader>

          {/* Cart Items List */}
          <div className="flex flex-col gap-3 py-3 max-h-[30vh] overflow-y-auto custom-scrollbar pr-1">
            {cart.map((item, idx) => {
              const itemPrice = item.product.price;
              return (
                <div key={idx} className="flex justify-between items-start text-xs border-b border-zinc-200 dark:border-zinc-800/60 pb-2.5">
                  <div className="flex gap-2.5 items-start flex-1 pr-4 min-w-0">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 rounded-md object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center">
                        <Coffee className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-zinc-900 dark:text-white truncate">{item.product.name}</p>
                      <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-0.5 capitalize">
                        {isId ? "Ukuran" : "Size"}: {item.size === 'small' ? (isId ? 'kecil' : 'small') : item.size === 'medium' ? (isId ? 'sedang' : 'medium') : (isId ? 'besar' : 'large')} {item.notes && `| ${isId ? "Catatan" : "Notes"}: ${item.notes}`}
                      </p>
                      <p className="text-xs font-extrabold text-[#4ADE80] mt-1">
                        {formatCurrency(itemPrice * item.quantity)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2.5 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-md border border-zinc-205 dark:border-zinc-800/50">
                      <button
                        onClick={() => updateQty(idx, -1)}
                        className="h-6 w-6 rounded-md bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-extrabold text-xs text-zinc-900 dark:text-white min-w-3 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(idx, 1)}
                        className="h-6 w-6 rounded-md bg-white dark:bg-zinc-900 border border-zinc-205 dark:border-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(idx)}
                      className="h-8 w-8 rounded-md bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center cursor-pointer transition-colors border border-red-500/20"
                      title={isId ? "Hapus dari Keranjang" : "Remove from Cart"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customer Details Form */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{isId ? "Nama Pelanggan" : "Customer Name"}</label>
              <Input
                type="text"
                placeholder={isId ? "Masukkan nama Anda..." : "Enter your name..."}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-zinc-100 dark:bg-zinc-950 border-zinc-202 dark:border-zinc-800 h-10 text-xs rounded-md focus:border-[#4ADE80] placeholder-zinc-450 dark:placeholder-zinc-650 text-zinc-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{isId ? "Nomor Meja" : "Table Number"}</label>
              <Input
                type="text"
                placeholder={isId ? "Tentukan nomor meja..." : "Select table number..."}
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                disabled={!!tableParam} // Lock table if scanned from QR
                className="bg-zinc-100 dark:bg-zinc-950 border-zinc-202 dark:border-zinc-800 h-10 text-xs rounded-md focus:border-[#4ADE80] disabled:opacity-55 disabled:cursor-not-allowed text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-zinc-100 dark:bg-zinc-950 p-4 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs flex flex-col gap-2 font-semibold text-zinc-600 dark:text-zinc-400 mt-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-zinc-850 dark:text-zinc-200">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{isId ? "Pajak Restoran (10%)" : "Restaurant Tax (10%)"}</span>
              <span className="text-zinc-850 dark:text-zinc-200">{formatCurrency(tax)}</span>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 my-1"></div>
            <div className="flex justify-between text-sm font-black text-[#4ADE80]">
              <span>{isId ? "Total Pembayaran" : "Total Payment"}</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-4">
            <button
              onClick={() => handleCheckout()}
              disabled={isSubmitting || cart.length === 0}
              className="w-full h-11 bg-[#4ADE80] hover:bg-[#3ec473] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-zinc-950 font-black text-xs rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#4ADE80]/5 animate-pulse"
            >
              {isSubmitting ? (
                <span>{isId ? "Memproses..." : "Processing..."}</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isId ? "Pesan Sekarang (Bayar di Kasir)" : "Order Now (Pay at Cashier)"}</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Placed Orders Modal */}
      <Dialog open={isViewOrdersOpen} onOpenChange={setIsViewOrdersOpen}>
        <DialogContent className={`max-w-87.5 ${isDarkMode ? 'dark bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'} rounded-md p-6 text-left shadow-2xl`}>
          <DialogHeader className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center w-full pr-6">
              <DialogTitle className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <ReceiptText className="h-5 w-5 text-[#4ADE80]" />
                {isId ? "Riwayat Pesanan" : "My Placed Orders"}
              </DialogTitle>
              {/* {placedOrders.length > 0 && (
                <button
                  onClick={clearAllPlacedOrders}
                  className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                  {isId ? "Hapus Semua" : "Clear All"}
                </button>
              )} */}
            </div>
            <DialogDescription className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-1 block">
              {isId ? "Klik pada nomor struk untuk melacak status pesanan di dapur." : "Click on any receipt number to track its progress in the kitchen."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 py-4 max-h-[30vh] overflow-y-auto scrollbar-none pr-1">
            {placedOrders.map((receiptNum) => (
              <div
                key={receiptNum}
                onClick={() => {
                  setIsViewOrdersOpen(false);
                  setActiveTrackingReceipt(receiptNum);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-md border text-xs font-bold transition-all hover:scale-[1.01] text-left cursor-pointer group ${isDarkMode
                  ? 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-700'
                  }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-extrabold text-sm text-[#4ADE80]">{receiptNum}</span>
                  <span className="text-[9px] text-zinc-500 font-semibold">{isId ? "Ketuk untuk melacak" : "Tap to track order"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                  <button
                    onClick={(e) => deletePlacedOrder(receiptNum, e)}
                    className="p-1 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors cursor-pointer"
                    title={isId ? "Hapus" : "Delete"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => setIsViewOrdersOpen(false)}
            className="w-full bg-[#0A422D] hover:bg-[#0A422D]/90 text-white font-bold text-xs rounded-md"
          >
            {isId ? "Tutup" : "Close"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Live Order Status Tracker Modal */}
      <Dialog open={!!activeTrackingReceipt} onOpenChange={(open) => { if (!open) setActiveTrackingReceipt(null); }}>
        <DialogContent className={`max-w-87.5 ${isDarkMode ? 'dark bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'} rounded-md p-6 text-left shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar`}>
          {activeTrackingReceipt && (
            <OrderStatusTracker
              receiptNumberProp={activeTrackingReceipt}
              onClose={() => setActiveTrackingReceipt(null)}
              isModal={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Premium Alert Dialog Modal */}
      <Dialog open={alertDialog.isOpen} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className={`max-w-87.5 ${isDarkMode ? 'dark bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'} rounded-md p-6 text-center shadow-2xl z-9999`}>
          <DialogHeader className="pb-2 border-b border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white leading-none text-center">
              {alertDialog.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 mt-3 leading-relaxed text-center font-medium">
            {alertDialog.message}
          </p>
          <Button
            onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
            className="w-full bg-[#0A422D] hover:bg-[#0A422D]/90 text-white font-bold text-xs rounded-md mt-4"
          >
            {isId ? "Tutup" : "Close"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
} 

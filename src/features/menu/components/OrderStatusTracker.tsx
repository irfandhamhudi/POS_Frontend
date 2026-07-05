import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from 'src/api';
import { Card } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { useTranslation } from 'src/hooks/useTranslation';

import {

  Clock,
  CheckCircle2,
  HelpCircle,
  Receipt,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { formatCurrency } from 'src/lib/utils';

interface ProductDetails {
  name: string;
  price: number;
  image?: string;
}

interface CartItem {
  product: ProductDetails;
  quantity: number;
  size: 'small' | 'medium' | 'large';
  notes: string;
}

interface Transaction {
  _id: string;
  receiptNumber: string;
  items: CartItem[];
  total: number;
  status: 'completed' | 'cancelled' | 'pending';
  kitchenStatus: 'pending' | 'preparing' | 'ready' | 'served';
  customerName: string;
  tableNumber: string;
  createdAt: string;
}

interface OrderStatusTrackerProps {
  receiptNumberProp?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  receiptNumberProp,
  onClose,
  isModal = false
}) => {
  const { receiptNumber: paramsReceiptNumber } = useParams<{ receiptNumber: string }>();
  const receiptNumber = receiptNumberProp || paramsReceiptNumber;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tx) return;
    if (prevStatusRef.current === 'pending' && tx.status === 'completed') {
      setPaymentApproved(true);
    }
    prevStatusRef.current = tx.status;
  }, [tx]);

  const fetchStatus = async (isInitial = false) => {
    if (!receiptNumber) return;
    if (isInitial) setLoading(true);
    try {
      const response = await api.get(`/transactions/public/status/${receiptNumber}`);
      if (response.data.success) {
        setTx(response.data.data);
        setError(null);
      }
    } catch (err: any) {
      console.error('Fetch Status Error:', err);
      setError(t('orderTracker.loadError', 'Gagal memuat status pesanan. Pastikan nomor struk benar.'));
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Poll status every 8 seconds
  useEffect(() => {
    if (!receiptNumber) return;
    fetchStatus(true);
    const interval = setInterval(() => fetchStatus(false), 8000);
    return () => clearInterval(interval);
  }, [receiptNumber]);

  const getStepStatus = (step: 'pending' | 'preparing' | 'ready' | 'served') => {
    if (!tx) return 'upcoming';

    // If order is cancelled, show error or warning
    if (tx.status === 'cancelled') return 'cancelled';

    const order = ['pending', 'preparing', 'ready', 'served'];
    const currentIdx = order.indexOf(tx.kitchenStatus);
    const targetIdx = order.indexOf(step);

    if (currentIdx === targetIdx) return 'active';
    if (currentIdx > targetIdx) return 'completed';
    return 'upcoming';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-white">
        <Loader2 className="h-8 w-8 text-[#4ADE80] animate-spin mb-3" />
        <p className="text-zinc-400 text-sm font-medium">{t('orderTracker.loading', 'Mendapatkan Status Pesanan...')}</p>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 p-6 text-white text-center gap-4">
        <HelpCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-base font-bold">{t('orderTracker.notFound', 'Pesanan Tidak Ditemukan')}</h2>
        <p className="text-xs text-zinc-400 max-w-xs">{error || t('orderTracker.notFoundDesc', 'Tidak dapat memuat detail untuk struk ini.')}</p>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
          <Button onClick={() => fetchStatus(true)} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs">
            <RotateCcw className="h-3.5 w-3.5 mr-1" /> {t('orderTracker.retry', 'Coba Lagi')}
          </Button>
          <Button onClick={() => navigate('/menu')} className="bg-[#4ADE80] hover:bg-[#3ec473] text-zinc-950 font-black text-xs">
            {t('orderTracker.backToMenu', 'Kembali ke Menu')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={isModal ? "text-zinc-105 font-sans" : "min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-12 max-w-md mx-auto relative border-x border-zinc-850 shadow-2xl"}>
      {/* Top Header */}
      {!isModal && (
        <div className="p-6 border-b border-zinc-900 bg-gradient-to-br from-[#06261b] to-zinc-950">
          <h1 className="text-xl font-black text-white">{t('orderTracker.title', 'Pelacak Status Pesanan')}</h1>
          <p className="text-xs text-zinc-400 mt-1">{t('orderTracker.receipt', 'Struk')}: {tx.receiptNumber} | {tx.customerName}</p>
        </div>
      )}

      <div className={isModal ? "flex flex-col gap-4 mt-2" : "p-4 flex flex-col gap-5"}>

        {/* Payment Warning if unpaid */}
        {tx.status === 'pending' && (
          <Card className="border-amber-500/20 bg-amber-500/5 text-amber-500 p-4 rounded-md flex flex-col gap-2 border">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="font-extrabold text-sm">{t('orderTracker.paymentWarning', 'Pembayaran di Kasir')}</span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-400 leading-relaxed text-left">
              {t('orderTracker.paymentWarningDesc', 'Silakan lakukan pembayaran di kasir dengan menyebutkan nomor struk Anda')} (<b>{tx.receiptNumber}</b>). Dapur kami sedang memproses pesanan Anda.
            </p>
          </Card>
        )}

        {/* Payment Success */}
        {paymentApproved && (
          <Card className="border-green-500/20 bg-green-500/5 text-green-400 p-4 rounded-md flex flex-col gap-2 border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-extrabold text-sm">{t('orderTracker.paymentSuccess', 'Pembayaran Sukses')}</span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-400 text-left">
              {t('orderTracker.paymentSuccessDesc', 'Pembayaran Anda telah dikonfirmasi. Pesanan sedang disiapkan.')}
            </p>
          </Card>
        )}

        {tx.status === 'cancelled' && (
          <Card className="border-red-500/20 bg-red-500/5 text-red-400 p-4 rounded-md flex flex-col gap-2 border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-red-500" />
              <span className="font-extrabold text-sm">{t('orderTracker.orderCancelled', 'Pesanan Dibatalkan')}</span>
            </div>
            <p className="text-[11px] font-semibold text-zinc-400 text-left">
              {t('orderTracker.orderCancelledDesc', 'Pesanan ini telah dibatalkan oleh kasir atau sistem pembayaran dibatalkan.')}
            </p>
          </Card>
        )}

        {/* Timeline Status */}
        {tx.status !== 'cancelled' && (
          <Card className="bg-zinc-900 border-zinc-800 p-5 rounded-md flex flex-col gap-6">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('orderTracker.kitchenProgress', 'Progres Dapur')}</span>
              <h2 className="text-lg font-black text-white mt-1">
                {tx.kitchenStatus === 'pending' && t('orderTracker.queued', 'Antrean Masuk')}
                {tx.kitchenStatus === 'preparing' && t('orderTracker.cooking', 'Sedang Dimasak')}
                {tx.kitchenStatus === 'ready' && t('orderTracker.readyToServe', 'Siap Disajikan!')}
                {tx.kitchenStatus === 'served' && t('orderTracker.served', 'Sudah Disajikan')}
              </h2>
            </div>

            {/* Steps Timeline */}
            <div className="flex flex-col gap-6 relative pl-3.5">
              {/* Timeline Line */}
              <div className="absolute left-[20px] top-2 bottom-2 w-0.5 bg-zinc-800"></div>

              {/* Step 1: Diterima */}
              <div className="flex gap-4 items-start relative z-10">
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center -translate-x-1.5 transition-colors ${getStepStatus('pending') === 'completed' ? 'bg-[#4ADE80] border-[#4ADE80]' :
                  getStepStatus('pending') === 'active' ? 'bg-[#4ADE80] border-[#4ADE80] ring-4 ring-[#4ADE80]/15' :
                    'bg-zinc-900 border-zinc-700'
                  }`}></div>
                <div className="flex flex-col text-left">
                  <p className={`font-extrabold text-xs ${getStepStatus('pending') === 'upcoming' ? 'text-zinc-500' : 'text-white'}`}>{t('orderTracker.orderReceived', 'Pesanan Diterima')}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{t('orderTracker.kitchenReceived', 'Dapur telah menerima pesanan Anda.')}</p>
                </div>
              </div>

              {/* Step 2: Dimasak */}
              <div className="flex gap-4 items-start relative z-10">
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center -translate-x-1.5 transition-colors ${getStepStatus('preparing') === 'completed' ? 'bg-[#4ADE80] border-[#4ADE80]' :
                  getStepStatus('preparing') === 'active' ? 'bg-amber-500 border-amber-500 ring-4 ring-amber-500/15' :
                    'bg-zinc-900 border-zinc-700'
                  }`}></div>
                <div className="flex flex-col text-left">
                  <p className={`font-extrabold text-xs ${getStepStatus('preparing') === 'upcoming' ? 'text-zinc-500' : 'text-white'}`}>{t('orderTracker.cooking', 'Sedang Dimasak')}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{t('orderTracker.cookingDesc', 'Koki atau Barista sedang menyiapkan pesanan.')}</p>
                </div>
              </div>

              {/* Step 3: Siap */}
              <div className="flex gap-4 items-start relative z-10">
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center -translate-x-1.5 transition-colors ${getStepStatus('ready') === 'completed' ? 'bg-[#4ADE80] border-[#4ADE80]' :
                  getStepStatus('ready') === 'active' ? 'bg-[#4ADE80] border-[#4ADE80] ring-4 ring-[#4ADE80]/15' :
                    'bg-zinc-900 border-zinc-700'
                  }`}></div>
                <div className="flex flex-col text-left">
                  <p className={`font-extrabold text-xs ${getStepStatus('ready') === 'upcoming' ? 'text-zinc-500' : 'text-white'}`}>{t('orderTracker.readyToServe', 'Siap Disajikan')}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{t('orderTracker.readyToServeDesc', 'Makanan/minuman siap diambil di counter.')}</p>
                </div>
              </div>

              {/* Step 4: Selesai */}
              <div className="flex gap-4 items-start relative z-10">
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center -translate-x-1.5 transition-colors ${getStepStatus('served') === 'completed' || getStepStatus('served') === 'active' ? 'bg-zinc-100 border-zinc-100' :
                  'bg-zinc-900 border-zinc-700'
                  }`}></div>
                <div className="flex flex-col text-left">
                  <p className={`font-extrabold text-xs ${getStepStatus('served') === 'upcoming' ? 'text-zinc-500' : 'text-white'}`}>{t('orderTracker.orderCompleted', 'Selesai Disajikan')}</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{t('orderTracker.servedDesc', 'Pesanan telah dinikmati.')}</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Order Details Accordion/Card */}
        <Card className="bg-zinc-900 border-zinc-800 p-5 rounded-md flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Receipt className="h-4.5 w-4.5 text-[#4ADE80]" />
            <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">{t('orderTracker.menuDetails', 'Rincian Menu')}</h3>
          </div>

          <div className="flex flex-col gap-3">
            {tx.items.map((item, idx) => {
              return (
                <div key={idx} className="flex items-start justify-between text-xs border-b border-zinc-800/40 pb-2 last:border-b-0 last:pb-0">
                  <div className="flex gap-2.5 items-start text-left min-w-0">
                    {item.product?.image && (
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="h-10 w-10 rounded-md object-cover border border-zinc-800 shrink-0" 
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-extrabold text-white truncate">{item.product?.name || t('orderTracker.defaultItem', 'Item Kopi')}</p>
                      <p className="text-[10px] text-zinc-400 capitalize mt-0.5">
                        {t('orderTracker.size', 'Ukuran')}: {item.size === 'small' ? t('orderTracker.small', 'kecil') : item.size === 'medium' ? t('orderTracker.medium', 'sedang') : t('orderTracker.large', 'besar')} {item.notes && `| ${t('orderTracker.notes', 'Catatan')}: ${item.notes}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-zinc-300 shrink-0 ml-3">{item.quantity}x</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-sm font-black text-[#4ADE80] border-t border-zinc-800 pt-3 mt-1">
            <span>{t('orderTracker.totalPaid', 'Total Terbayar')}</span>
            <span>{formatCurrency(tx.total)}</span>
          </div>
        </Card>

        {/* Support Callout */}
        <div className="text-center text-[10px] text-zinc-500 font-medium px-4 mt-2">
          {t('orderTracker.supportMessage', 'Punya kendala dengan pesanan Anda? Hubungi kasir/waiter kami di meja depan dengan menyebutkan nomor struk Anda.')}
        </div>

        {/* Back button */}
        <Button
          onClick={() => {
            if (isModal && onClose) {
              onClose();
            } else {
              navigate('/menu');
            }
          }}
          className="bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs h-11 rounded-md mt-3 cursor-pointer"
        >
          {isModal ? t('orderTracker.close', 'Tutup') : t('orderTracker.orderMore', 'Pesan Menu Lainnya')}
        </Button>

      </div>
    </div>
  );
};

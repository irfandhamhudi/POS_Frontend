import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { Card } from 'src/components/ui/card';
import {
  Star,
  MoreHorizontal,
} from 'lucide-react';

interface PerformanceScoreProps {
  todaySales: number;
  transactions?: any[];
}

export const PerformanceScore: React.FC<PerformanceScoreProps> = ({ todaySales, transactions = [] }) => {
  const { t } = useTranslation();

  const breakdown = React.useMemo(() => {
    const list = transactions || [];
    let dineInCount = 0;
    let takeAwayCount = 0;
    let onlineCount = 0;

    let cashRevenue = 0;
    let cardRevenue = 0;
    let qrisRevenue = 0;

    list.forEach((tx) => {
      // Order type
      if (tx.orderType === 'dine_in') dineInCount++;
      else if (tx.orderType === 'take_away') takeAwayCount++;
      else if (tx.orderType === 'order_online') onlineCount++;

      // Payment method
      if (tx.paymentMethod === 'cash') cashRevenue += tx.total;
      else if (tx.paymentMethod === 'card') cardRevenue += tx.total;
      else if (tx.paymentMethod === 'qris') qrisRevenue += tx.total;
    });

    const totalRevenue = cashRevenue + cardRevenue + qrisRevenue;

    return {
      orderTypes: {
        dineIn: dineInCount,
        takeAway: takeAwayCount,
        online: onlineCount,
        total: dineInCount + takeAwayCount + onlineCount
      },
      paymentMethods: {
        cash: cashRevenue,
        card: cardRevenue,
        qris: qrisRevenue,
        total: totalRevenue
      }
    };
  }, [transactions]);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Star className="size-4 text-amber-500 fill-amber-500" />
          <span className="font-bold text-sm text-foreground">{t('adminDashboard.performanceScore')}</span>
        </div>
        <MoreHorizontal className="size-4 text-muted-foreground cursor-pointer" />
      </div>

      <div className="flex items-center gap-4 py-1.5 justify-center sm:justify-start">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" width="80" height="80">
            <circle cx="40" cy="40" r="34" fill="none" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="6" />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="#0A422D"
              strokeWidth="6"
              strokeDasharray={`${(Math.min(todaySales, 48) / 48) * 213.6} 213.6`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xl font-extrabold text-foreground">
            {todaySales}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            {todaySales}/48 orders
          </p>
          <p className="text-[11px] text-muted-foreground/60 uppercase font-bold mt-0.5">{t('adminDashboard.dailyGoal')}</p>
        </div>
      </div>

      {/* Transaction Breakdown */}
      <div className="flex flex-col gap-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
        {/* Payment Methods Section */}
        <div className="flex flex-col gap-2.5">
          <p className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            {t('adminDashboard.paymentMethods', 'Metode Pembayaran')}
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: t('adminDashboard.cash', 'Tunai'), value: breakdown.paymentMethods.cash, color: 'bg-[#0A422D] dark:bg-[#4ADE80]', barBg: 'bg-[#0A422D]/10 dark:bg-[#4ADE80]/10' },
              { label: t('adminDashboard.qris', 'QRIS'), value: breakdown.paymentMethods.qris, color: 'bg-purple-600 dark:bg-purple-500', barBg: 'bg-purple-100 dark:bg-purple-950/30' }
            ].map((pm, idx) => {
              const percentage = breakdown.paymentMethods.total > 0
                ? (pm.value / breakdown.paymentMethods.total) * 100
                : 0;
              return (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-semibold text-foreground">
                    <span className="text-muted-foreground">{pm.label}</span>
                    <span className="font-extrabold">
                      Rp {pm.value.toLocaleString()} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className={`w-full h-1.5 rounded-full ${pm.barBg}`}>
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${pm.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Types Section */}
        <div className="flex flex-col gap-2.5 mt-2">
          <p className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            {t('adminDashboard.orderTypes', 'Tipe Pesanan')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: t('adminDashboard.dineIn', 'Dine In'), count: breakdown.orderTypes.dineIn, border: 'border-emerald-250/20 dark:border-emerald-800/30', bg: 'bg-[#0A422D]/[0.02] dark:bg-[#4ADE80]/[0.02]' },
              { label: t('adminDashboard.takeAway', 'Take Away'), count: breakdown.orderTypes.takeAway, border: 'border-blue-250/20 dark:border-blue-800/30', bg: 'bg-blue-500/[0.02] dark:bg-blue-400/[0.02]' },
              { label: t('adminDashboard.online', 'Online'), count: breakdown.orderTypes.online, border: 'border-purple-250/20 dark:border-purple-800/30', bg: 'bg-purple-500/[0.02] dark:bg-purple-400/[0.02]' }
            ].map((ot, idx) => (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border ${ot.border} ${ot.bg}`}
              >
                <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center">{ot.label}</span>
                <span className="text-sm font-black text-foreground mt-1">{ot.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

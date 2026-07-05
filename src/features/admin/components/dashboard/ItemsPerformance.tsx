import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card';

interface ItemsPerformanceProps {
  radarData: any[];
}

export const ItemsPerformance: React.FC<ItemsPerformanceProps> = ({ radarData }) => {
  const { t } = useTranslation();

  return (
    <Card className="p-5">
      <CardHeader className="pb-1">
        <CardTitle className="text-base font-semibold">{t('adminDashboard.itemsPerformance')}</CardTitle>
        <CardDescription>{t('adminDashboard.salesDistribution')}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        <div className="w-full aspect-square max-w-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="77%" data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="var(--border)" className="stroke-border/50" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-[#1C1C19] border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg shadow-md text-xs flex flex-col gap-1">
                        <p className="font-extrabold text-foreground">{data.category}</p>
                        <p className="text-zinc-505 dark:text-zinc-400">
                          {t('adminDashboard.sold', 'Terjual')}: <span className="font-bold text-foreground">{data.sold} item</span>
                        </p>
                        <p className="text-zinc-505 dark:text-zinc-400">
                          {t('adminDashboard.stock', 'Stok')}: <span className="font-bold text-foreground">{data.stock} item</span>
                        </p>
                        <div className="border-t border-zinc-100 dark:border-[#2D2D2A] mt-1 pt-1 flex justify-between gap-4">
                          <span className="text-zinc-400 font-medium">{t('adminDashboard.score', 'Skor')}</span>
                          <span className="font-black text-[#0A422D] dark:text-[#4ADE80]">{data.value}/100</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Radar
                dataKey="value"
                stroke="#0A422D"
                fill="#0A422D"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

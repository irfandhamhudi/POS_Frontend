import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from 'src/components/ui/chart';

const chartConfig = {
  coffee: {
    label: 'Coffee',
    color: '#0A422D',
  },
  tea: {
    label: 'Tea',
    color: '#EAB308',
  },
  snack: {
    label: 'Snack',
    color: '#EF4444',
  },
  main: {
    label: 'Main',
    color: '#8B5CF6',
  },
} satisfies ChartConfig;

interface HourlySalesChartProps {
  hourlyChartData: any[];
}

export const HourlySalesChart: React.FC<HourlySalesChartProps> = ({ hourlyChartData }) => {
  const { t } = useTranslation();

  return (
    <Card className="lg:col-span-2 p-3">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-semibold">{t('adminDashboard.salesStats')}</CardTitle>
          <CardDescription>{t('adminDashboard.hourlyPerformance')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-57.5 w-full">
          <AreaChart data={hourlyChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillCoffee" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A422D" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0A422D" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillTea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EAB308" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillSnack" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[10px] text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-[10px] text-muted-foreground"
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area dataKey="coffee" type="natural" fill="url(#fillCoffee)" stroke="#0A422D" stackId="a" strokeWidth={2} />
            <Area dataKey="tea" type="natural" fill="url(#fillTea)" stroke="#EAB308" stackId="a" strokeWidth={2} />
            <Area dataKey="snack" type="natural" fill="url(#fillSnack)" stroke="#EF4444" stackId="a" strokeWidth={2} />
            <Area dataKey="main" type="natural" fill="url(#fillMain)" stroke="#8B5CF6" stackId="a" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

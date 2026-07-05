import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatCurrency } from 'src/lib/utils';
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardAction,
  CardFooter,
} from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import {
  DollarSign,
  ShoppingBag,
  Activity,
  Users,
} from 'lucide-react';

interface DashboardStatsProps {
  netRevenue: number;
  todaySales: number;
  onProgress: number;
  avgOrder: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  netRevenue,
  todaySales,
  onProgress,
  avgOrder,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('adminDashboard.netRevenue', 'Net Revenue')}
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {formatCurrency(netRevenue)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 border-[#0A422D]/20 text-[#0A422D] bg-[#0A422D]/5 dark:text-green-400 dark:border-green-500/20">
              <DollarSign className="size-3" />
              {t('adminDashboard.revenueBadge')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-[11px] text-muted-foreground pt-2">
          {t('adminDashboard.fromYesterday')}
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('adminDashboard.todaySales')}
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {todaySales}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 border-amber-500/20 text-amber-600 bg-amber-500/5 dark:text-amber-400">
              <ShoppingBag className="size-3" />
              {t('adminDashboard.ordersBadge')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-[11px] text-muted-foreground pt-2">
          {t('adminDashboard.comparedToLastHour')}
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('adminDashboard.dineInOrders')}
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {onProgress}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 border-purple-500/20 text-purple-600 bg-purple-500/5 dark:text-purple-400">
              <Activity className="size-3" />
              {t('adminDashboard.dineInBadge')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-[11px] text-muted-foreground pt-2">
          {t('adminDashboard.activeInsideStore')}
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader className="pb-2">
          <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t('adminDashboard.avgOrderValue')}
          </CardDescription>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {formatCurrency(avgOrder)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 border-blue-500/20 text-blue-600 bg-blue-500/5 dark:text-blue-400">
              <Users className="size-3" />
              {t('adminDashboard.averageBadge')}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="text-[11px] text-muted-foreground pt-2">
          {t('adminDashboard.avgBasketSize')}
        </CardFooter>
      </Card>
    </div>
  );
};

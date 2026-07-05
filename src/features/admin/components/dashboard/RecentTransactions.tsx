import React from 'react';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatCurrency } from 'src/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import {
  Avatar,
  AvatarFallback,
} from 'src/components/ui/avatar';
import { Badge } from 'src/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

const avatarColors = [
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
];

interface TransactionItem {
  id: string;
  customerName: string;
  orderType: string;
  tableNumber?: string | null;
  total: number;
}

interface RecentTransactionsProps {
  recentTransactions: TransactionItem[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ recentTransactions }) => {
  const { t } = useTranslation();

  return (
    <Card className="lg:col-span-2 p-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base font-semibold">{t('adminDashboard.recentTransactions')}</CardTitle>
          <CardDescription>{t('adminDashboard.recentTransactionsDesc')}</CardDescription>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 font-medium cursor-pointer" asChild>
          <a href="/admin/orders">
            {t('adminDashboard.viewAll')}
            <ArrowUpRight className="size-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('adminDashboard.customer')}</TableHead>
                <TableHead>{t('adminDashboard.table', 'Table')}</TableHead>
                <TableHead>{t('adminDashboard.orderType')}</TableHead>
                <TableHead className="text-right">{t('adminDashboard.amount')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((tx, idx) => {
                const colorIdx = idx % avatarColors.length;
                const initials = (tx.customerName || 'U')
                  .split(' ')
                  .slice(0, 2)
                  .map((w: string) => w[0])
                  .join('');

                return (
                  <TableRow key={tx.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className={`${avatarColors[colorIdx]} text-xs font-bold`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate">{tx.customerName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.orderType === 'dine_in'
                        ? tx.tableNumber || '-'
                        : tx.orderType === 'take_away'
                          ? t('pos.takeAway', 'Take Away')
                          : t('pos.orderOnline', 'Order Online')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.orderType === 'dine_in' ? 'default' : 'secondary'}
                        className="rounded capitalize text-[10px] font-bold py-0 h-4"
                      >
                        {tx.orderType === 'dine_in'
                          ? t('adminDashboard.dineInBadge')
                          : t('adminDashboard.takeawayBadge')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm text-foreground">
                      {formatCurrency(tx.total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {recentTransactions.length === 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            {t('adminDashboard.noTransactions')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

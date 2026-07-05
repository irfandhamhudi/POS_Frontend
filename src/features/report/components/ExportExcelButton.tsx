import React, { useState } from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import type { Transaction } from '../../order/types';
import { useTranslation } from '../../../hooks/useTranslation';

interface PopularItem {
  name: string;
  category: string;
  qty: number;
  revenue: number;
}

interface CashoutItem {
  amount: number;
  description: string;
  createdAt: string;
}

interface ExportExcelButtonProps {
  transactions: Transaction[];
  popularItems: PopularItem[];
  cashouts?: CashoutItem[];
  dateLabel?: string;
  filenameLabel?: string;
}

export const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  transactions,
  popularItems,
  cashouts,
  dateLabel,
  filenameLabel,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { t, currentLanguage } = useTranslation();

  const handleExport = async () => {
    if (transactions.length === 0) return;
    setIsExporting(true);
    try {
      await exportToExcel(transactions, popularItems, currentLanguage as 'en' | 'id', cashouts, dateLabel, filenameLabel);
    } finally {
      setIsExporting(false);
    }
  };

  const isExportDisabled = isExporting || transactions.length === 0;

  return (
    <button
      onClick={handleExport}
      disabled={isExportDisabled}
      className="flex items-center gap-2 bg-[#0A422D] hover:bg-[#083524] text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-sm border border-[#0A422D]/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
      title={transactions.length === 0 ? t('reportManagement.noTransactionsToExport', 'No transactions in the selected period') : t('reportManagement.exportToExcel', 'Export to Excel')}
    >
      {isExporting ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {t('reportManagement.exporting', 'Exporting...')}
        </>
      ) : (
        <>
          <FileSpreadsheet className="size-4" />
          {t('reportManagement.exportToExcel', 'Export to Excel')}
        </>
      )}
    </button>
  );
};
export default ExportExcelButton;

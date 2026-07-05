import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'src/hooks/useTranslation';
import { Printer, X } from 'lucide-react';
import type { SavedPayroll } from './SalaryManagement';

interface SalarySlipModalProps {
  payroll: SavedPayroll;
  onClose: () => void;
}

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({ payroll, onClose }) => {
  const { t, i18n } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const p = payroll;
  const paidDays = p.isPaidHolidays ? p.actualWorkDays + p.holidaysCount : p.actualWorkDays;
  const baseSalary = paidDays * p.dailySalary;

  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';

  const formatDateLocale = (dateStr: string | Date | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatPeriodLocale = (period: string) => {
    if (!period) return '';
    const [year, month] = period.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const handlePrint = () => {
    const slipContent = document.getElementById('salary-slip-content');
    if (!slipContent) return;

    const slipHTML = slipContent.innerHTML;

    const winPrint = window.open('', '', 'left=0,top=0,width=800,height=600,toolbar=0,scrollbars=0,status=0');
    if (!winPrint) return;

    winPrint.document.write(`
      <html>
        <head>
          <title>${t('salary.slipTitle', 'Salary Slip')} - ${p.employee.name}</title>
          <style>
            @page { size: A4; margin: 15mm; }
             body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 24px 0;
            }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 6px 8px; text-align: left; }
            .border-b { border-bottom: 1px solid #ddd; }
            .border-t { border-top: 1px solid #ddd; }
            .border { border: 1px solid #000; }
            .font-bold { font-weight: bold; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-lg { font-size: 16px; }
            .text-sm { font-size: 11px; }
            .text-xs { font-size: 10px; }
            .text-muted { color: #666; }
            .bg-gray { background: #f5f5f5; }
            .mt-1 { margin-top: 4px; }
            .mt-2 { margin-top: 8px; }
            .mt-3 { margin-top: 12px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .px-2 { padding-left: 8px; padding-right: 8px; }
            .mb-8 { margin-bottom: 32px; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          ${slipHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          <\/script>
        </body>
      </html>
    `);
    winPrint.document.close();
    winPrint.focus();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl mx-4">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-[#1C1C19] border-b border-border/60 px-4 py-3 rounded-t-xl">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Printer className="size-4 text-[#0A422D] dark:text-[#4ADE80]" />
            {t('salary.slipTitle', 'Salary Slip')}
          </h2>
          <button
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground cursor-pointer transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="bg-white dark:bg-[#1C1C19] p-4 rounded-b-xl">
          <div
            id="salary-slip-content"
            ref={printRef}
            className="bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 p-4 rounded-lg border border-border/60 dark:border-zinc-700 shadow-sm"
          >
            {/* Header: Company + Title */}
            <div className="flex items-start justify-between border-b-2 border-black dark:border-zinc-300 pb-3 mb-4">
              <div>
                <h1 className="text-lg font-bold uppercase tracking-wider text-[#0A422D] dark:text-[#4ADE80]">
                  GREEN GROUNDS COFFEE
                </h1>
                <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-0.5">
                  {t('salary.slipAddress', '123 Green Street, Food Court')} &middot; {t('salary.slipPhone', 'Tel: +62 812-3456-7890')}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[#0A422D] dark:text-[#4ADE80]">
                  {t('salary.slipDocumentTitle', 'SALARY SLIP')}
                </h2>
                <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">
                  {t('salary.slipPeriod', 'Period')}: <span className="font-semibold text-foreground dark:text-zinc-100">{formatPeriodLocale(p.periodName)}</span>
                </p>
              </div>
            </div>

            {/* Employee Info */}
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 mb-2">
                {t('salary.slipEmployee', 'Employee')}
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="w-1/4 text-muted-foreground dark:text-zinc-400 py-1">{t('salary.slipEmployee', 'Employee')}</td>
                    <td className="w-1/4 font-semibold py-1">: {p.employee.name}</td>
                    <td className="w-1/4 text-muted-foreground dark:text-zinc-400 py-1">{t('salary.slipUsername', 'Username')}</td>
                    <td className="w-1/4 font-semibold py-1">: @{p.employee.username}</td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground dark:text-zinc-400 py-1">{t('salary.slipStatus', 'Status')}</td>
                    <td className="font-semibold py-1">
                      : <span className={p.status === 'paid' ? 'text-green-700 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}>
                        {p.status === 'paid' ? t('salary.paid', 'PAID') : t('salary.draft', 'DRAFT')}
                      </span>
                    </td>
                    <td className="text-muted-foreground dark:text-zinc-400 py-1">{t('salary.slipPaymentDate', 'Payment Date')}</td>
                    <td className="font-semibold py-1">: {formatDateLocale(p.paymentDate)}</td>
                  </tr>
                  <tr>
                    <td className="text-muted-foreground dark:text-zinc-400 py-1">{t('salary.slipDateRange', 'Date Range')}</td>
                    <td className="font-semibold py-1">: {formatDateLocale(p.startDate)} - {formatDateLocale(p.endDate)}</td>
                    <td className="text-muted-foreground dark:text-zinc-400 py-1">{t('salary.slipBank', 'Bank Account')}</td>
                    <td className="font-semibold py-1">
                      : {p.employee.bankName && p.employee.bankAccountNumber
                        ? `${p.employee.bankName} (${p.employee.bankAccountNumber})`
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Earnings Table */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 mb-2">
                {t('salary.slipEarnings', 'EARNINGS')}
              </h3>
              <table className="w-full text-sm border border-border/60 dark:border-zinc-700">
                <thead>
                  <tr className="bg-muted/50 dark:bg-zinc-800 border-b border-border/60 dark:border-zinc-700">
                    <th className="text-left py-2 px-3 font-bold uppercase text-[10px] tracking-wider">{t('salary.slipDescription', 'Description')}</th>
                    <th className="text-right py-2 px-3 font-bold uppercase text-[10px] tracking-wider">{t('salary.slipDetail', 'Detail')}</th>
                    <th className="text-right py-2 px-3 font-bold uppercase text-[10px] tracking-wider">{t('salary.slipAmount', 'Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/40 dark:border-zinc-800">
                    <td className="py-2 px-3">{t('salary.slipDailyRate', 'Daily Rate')}</td>
                    <td className="text-right py-2 px-3">{p.actualWorkDays} {t('salary.slipDays', 'days')} x {formatRupiah(p.dailySalary)}</td>
                    <td className="text-right py-2 px-3 font-semibold">{formatRupiah(baseSalary)}</td>
                  </tr>
                  {p.isPaidHolidays && p.holidaysCount > 0 && (
                    <tr className="border-b border-border/40 dark:border-zinc-800">
                      <td className="py-2 px-3">{t('salary.slipPaidHolidays', 'Paid Holidays')}</td>
                      <td className="text-right py-2 px-3">+{p.holidaysCount} {t('salary.slipDays', 'days')}</td>
                      <td className="text-right py-2 px-3 font-semibold text-green-700 dark:text-green-400">
                        +{formatRupiah(p.holidaysCount * p.dailySalary)}
                      </td>
                    </tr>
                  )}
                  {(p.overtimeHours || 0) > 0 && (
                    <tr className="border-b border-border/40 dark:border-zinc-800">
                      <td className="py-2 px-3">
                        <div>{t('salary.slipOvertime', 'Lembur')}</div>
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground dark:text-zinc-400 text-[10px]">{t('salary.overtimeDetail', '{{hours}} jam x {{rate}}', { hours: p.overtimeHours, rate: `Rp ${formatRupiah(p.overtimeRate || 20000)}` })}</td>
                      <td className="text-right py-2 px-3 font-semibold text-green-700 dark:text-green-400">+{formatRupiah(p.bonus)}</td>
                    </tr>
                  )}
                  {(p.latePenaltyCount || 0) > 0 && (
                    <tr className="border-b border-border/40 dark:border-zinc-800">
                      <td className="py-2 px-3">
                        <div>{t('salary.slipLatePenalty', 'Terlambat')}</div>
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground dark:text-zinc-400 text-[10px]">{t('salary.lateDetail', '{{count}}x {{rate}}', { count: p.latePenaltyCount, rate: formatRupiah(p.latePenaltyRate || 10000) })}</td>
                      <td className="text-right py-2 px-3 font-semibold text-red-500 dark:text-red-400">-{formatRupiah((p.latePenaltyCount || 0) * (p.latePenaltyRate || 10000))}</td>
                    </tr>
                  )}
                  {(p.unauthorizedAbsenceCount || 0) > 0 && (
                    <tr className="border-b border-border/40 dark:border-zinc-800">
                      <td className="py-2 px-3">
                        <div>{t('salary.slipUnauthorizedAbsence', 'Alpha')}</div>
                      </td>
                      <td className="text-right py-2 px-3 text-muted-foreground dark:text-zinc-400 text-[10px]">{t('salary.alphaDetail', '{{count}}x {{rate}}', { count: p.unauthorizedAbsenceCount, rate: formatRupiah(p.unauthorizedAbsenceRate || 100000) })}</td>
                      <td className="text-right py-2 px-3 font-semibold text-red-500 dark:text-red-400">-{formatRupiah((p.unauthorizedAbsenceCount || 0) * (p.unauthorizedAbsenceRate || 100000))}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30 dark:bg-zinc-800/50 font-bold">
                    <td className="py-2.5 px-3 uppercase text-xs">{t('salary.slipTotal', 'TOTAL')}</td>
                    <td className="text-right py-2.5 px-3"></td>
                    <td className="text-right py-2.5 px-3 text-base text-[#0A422D] dark:text-[#4ADE80]">{formatRupiah(p.totalSalary)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-10 text-center text-[9px] uppercase tracking-widest text-muted-foreground dark:text-zinc-500">
              *** {t('salary.slipFooter', 'This is a computer-generated document')} ***
            </div>
          </div>

          {/* Print Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handlePrint}
              className=" cursor-pointer flex items-center justify-end gap-1.5 px-5 py-2.5 bg-[#0A422D] hover:bg-[#0A422D]/90 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              <Printer className="size-4" />
              {t('salary.printSlip', 'Print')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

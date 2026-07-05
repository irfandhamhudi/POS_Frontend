import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';
import api from 'src/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'src/components/ui/alert-dialog';
import {
  Calendar,
  Settings,
  History,
  Save,
  Trash2,
  RefreshCw,
  Coins,
  AlertTriangle,
  Check,
  Info,
  ChevronDown,
  User,
  Users,
  Wallet,
  Briefcase,
  Eye,
  Calculator,
  Printer,
  FileDown,
  Search,
} from 'lucide-react';
import { useTranslation } from 'src/hooks/useTranslation';
import { SalarySlipModal } from './SalarySlipModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';

interface Employee {
  _id: string;
  name: string;
  username: string;
  disabled?: boolean;
  bankName?: string;
  bankAccountNumber?: string;
}

interface CalculatePayrollItem {
  employee: Employee;
  payrollId: string | null;
  dailySalary: number;
  actualWorkDays: number;
  calculatedWorkDays: number;
  bonus: number;
  bonusNote: string;
  overtimeHours: number;
  overtimeRate: number;
  deduction: number;
  deductionNote: string;
  latePenaltyCount: number;
  latePenaltyRate: number;
  unauthorizedAbsenceCount: number;
  unauthorizedAbsenceRate: number;
  totalSalary: number;
  status: 'draft' | 'paid';
  paymentDate: string | null;
  isSaved: boolean;
}

interface SalaryConfig {
  dailySalary: number;
  monthlyHolidays: number;
  cutoffDay: number;
}

export interface SavedPayroll {
  _id: string;
  employee: Employee;
  periodName: string;
  startDate: string;
  endDate: string;
  dailySalary: number;
  actualWorkDays: number;
  holidaysCount: number;
  bonus: number;
  bonusNote?: string;
  overtimeHours?: number;
  overtimeRate?: number;
  deduction: number;
  deductionNote?: string;
  latePenaltyCount?: number;
  latePenaltyRate?: number;
  unauthorizedAbsenceCount?: number;
  unauthorizedAbsenceRate?: number;
  totalSalary: number;
  status: 'draft' | 'paid';
  paymentDate: string | null;
  createdAt: string;
}

export const SalaryManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'calculate' | 'history' | 'settings'>('calculate');

  // Helper to format number with thousand separator dots
  const formatInputNumber = (val: number) => {
    if (val === undefined || val === null || isNaN(val)) return '';
    return new Intl.NumberFormat('id-ID').format(val);
  };

  // Helper to parse formatted text to raw number
  const parseInputNumber = (val: string) => {
    const clean = val.replace(/\./g, '').replace(/[^0-9]/g, '');
    return parseInt(clean) || 0;
  };

  // Dates / Period Select
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );

  // Config State
  const [config, setConfig] = useState<SalaryConfig>({
    dailySalary: 85000,
    monthlyHolidays: 4,
    cutoffDay: 25,
  });

  // Calculate Data States
  const [periodStartDate, setPeriodStartDate] = useState<string>('');
  const [periodEndDate, setPeriodEndDate] = useState<string>('');
  const [payrolls, setPayrolls] = useState<CalculatePayrollItem[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // History States
  const [historyPayrolls, setHistoryPayrolls] = useState<SavedPayroll[]>([]);
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  );
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Settings edit states
  const [settingsDailySalary, setSettingsDailySalary] = useState<number>(85000);
  const [settingsHolidays, setSettingsHolidays] = useState<number>(4);
  const [settingsCutoff, setSettingsCutoff] = useState<number>(25);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);

  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  } | null>(null);

  const [selectedPayrollIndexForCalculator, setSelectedPayrollIndexForCalculator] = useState<number | null>(null);
  const [slipPayroll, setSlipPayroll] = useState<SavedPayroll | null>(null);

  // Update employee bank info via API
  const handleUpdateBankInfo = async (employeeId: string, bankName: string, bankAccountNumber: string) => {
    try {
      await api.put(`/users/${employeeId}`, { bankName, bankAccountNumber });
      // Update local state
      setPayrolls((prev) =>
        prev.map((item) =>
          item.employee._id === employeeId
            ? {
                ...item,
                employee: {
                  ...item.employee,
                  bankName,
                  bankAccountNumber,
                },
              }
            : item
        )
      );
    } catch (err: any) {
      setAlertConfig({
        title: t('salary.errorTitle', 'Gagal Update Bank'),
        message: err.response?.data?.message || 'Gagal memperbarui data bank.',
        type: 'error',
      });
    }
  };

  // Load config
  const loadConfig = async () => {
    try {
      const response = await api.get('/salaries/config');
      if (response.data.success) {
        setConfig(response.data.data);
        setSettingsDailySalary(response.data.data.dailySalary);
        setSettingsHolidays(response.data.data.monthlyHolidays);
        setSettingsCutoff(response.data.data.cutoffDay);
      }
    } catch (err) {
      console.error('Failed to load salary config', err);
    }
  };

  // Calculate payroll endpoint trigger
  const handleCalculate = async () => {
    setIsCalculating(true);
    const periodStr = selectedPeriod;
    try {
      const response = await api.get(`/salaries/calculate?period=${periodStr}`);
      if (response.data.success) {
        const { startDate, endDate, payrolls: items } = response.data.data;
        setPeriodStartDate(startDate);
        setPeriodEndDate(endDate);
        setPayrolls(items);
      }
    } catch (err: any) {
      setAlertConfig({
        title: t('salary.errorTitle', 'Gagal Menghitung Gaji'),
        message: err.response?.data?.message || t('salary.errorCalcDesc', 'Terjadi kesalahan saat menghitung gaji.'),
        type: 'error',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  // Load history records
  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await api.get(`/salaries?period=${historyPeriodFilter}`);
      if (response.data.success) {
        setHistoryPayrolls(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load history payrolls', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Export Excel
  const handleExportCSV = async () => {
    if (payrolls.length === 0) return;

    const formatRp = (val: number) =>
      `Rp ${new Intl.NumberFormat('id-ID').format(val)}`;

    const headers = [
      t('salary.employeeName', 'Nama Karyawan'),
      t('salary.workDays', 'Hari Kerja'),
      t('salary.dailySalary', 'Gaji Harian'),
      t('salary.overtime', 'Lembur (Jam)'),
      t('salary.bonus', 'Bonus'),
      t('salary.latePenalty', 'Terlambat'),
      t('salary.unauthorizedAbsence', 'Alpha'),
      t('salary.deduction', 'Potongan'),
      t('salary.totalSalary', 'Total Gaji'),
      t('salary.status', 'Status'),
    ];

    const widths = [155, 155, 155, 155, 155, 155, 200, 155, 155, 155];

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Green Grounds Coffee';
    const ws = wb.addWorksheet('Payroll');

    // Set column widths only
    ws.columns = headers.map((_, i) => ({
      width: widths[i] / 7.5,
    }));

    const borderStyle = {
      top: { style: 'thin' as const, color: { argb: 'FF333333' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF333333' } },
      left: { style: 'thin' as const, color: { argb: 'FF333333' } },
      right: { style: 'thin' as const, color: { argb: 'FF333333' } },
    };

    // Header style
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Arial' },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A422D' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: borderStyle,
    };

    const dataStyle: Partial<ExcelJS.Style> = {
      font: { size: 11, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: borderStyle,
    };

    // Render header row
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => { cell.style = headerStyle; });
    headerRow.height = 30;

    // Render data rows
    payrolls.forEach((p) => {
      const row = ws.addRow([
        p.employee.name,
        new Intl.NumberFormat('id-ID').format(p.actualWorkDays),
        formatRp(p.dailySalary),
        p.overtimeHours,
        formatRp(p.bonus),
        p.latePenaltyCount,
        p.unauthorizedAbsenceCount,
        formatRp(p.deduction),
        formatRp(p.totalSalary),
        p.status === 'paid' ? 'LUNAS' : 'DRAFT',
      ]);
      row.eachCell((cell, col) => {
        cell.style = { ...dataStyle };
        if (col === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
      });
      row.height = 24;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${selectedPeriod}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Lifecycle
  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'calculate') {
      handleCalculate();
    } else if (activeTab === 'history') {
      loadHistory();
    }
  }, [selectedPeriod, activeTab, historyPeriodFilter]);

  // Handle salary inputs change
  const handlePayrollChange = (
    index: number,
    field: keyof CalculatePayrollItem,
    value: any
  ) => {
    setPayrolls((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'actualWorkDays') {
        item.actualWorkDays = Math.max(0, parseInt(value) || 0);
      } else if (field === 'dailySalary') {
        item.dailySalary = Math.max(0, parseInt(value) || 0);
      } else if (field === 'overtimeHours') {
        item.overtimeHours = Math.max(0, parseInt(value) || 0);
        item.bonus = item.overtimeHours * item.overtimeRate;
        item.bonusNote = item.overtimeHours > 0 ? t('salary.noteOvertime', 'Lembur {{hours}} jam x {{rate}}', { hours: item.overtimeHours, rate: formatRupiah(item.overtimeRate) }) : '';
      } else if (field === 'latePenaltyCount') {
        item.latePenaltyCount = Math.max(0, parseInt(value) || 0);
        item.deduction = (item.latePenaltyCount * item.latePenaltyRate) + (item.unauthorizedAbsenceCount * item.unauthorizedAbsenceRate);
        const parts = [];
        if (item.latePenaltyCount > 0) parts.push(t('salary.noteLate', 'Terlambat {{count}}x {{rate}}', { count: item.latePenaltyCount, rate: formatRupiah(item.latePenaltyRate) }));
        if (item.unauthorizedAbsenceCount > 0) parts.push(t('salary.noteAlpha', 'Alpha {{count}}x {{rate}}', { count: item.unauthorizedAbsenceCount, rate: formatRupiah(item.unauthorizedAbsenceRate) }));
        item.deductionNote = parts.join(', ');
      } else if (field === 'unauthorizedAbsenceCount') {
        item.unauthorizedAbsenceCount = Math.max(0, parseInt(value) || 0);
        item.deduction = (item.latePenaltyCount * item.latePenaltyRate) + (item.unauthorizedAbsenceCount * item.unauthorizedAbsenceRate);
        const parts = [];
        if (item.latePenaltyCount > 0) parts.push(t('salary.noteLate', 'Terlambat {{count}}x {{rate}}', { count: item.latePenaltyCount, rate: formatRupiah(item.latePenaltyRate) }));
        if (item.unauthorizedAbsenceCount > 0) parts.push(t('salary.noteAlpha', 'Alpha {{count}}x {{rate}}', { count: item.unauthorizedAbsenceCount, rate: formatRupiah(item.unauthorizedAbsenceRate) }));
        item.deductionNote = parts.join(', ');
      } else if (field === 'status') {
        item.status = value;
      }

      // Re-calculate Total Salary
      item.totalSalary = item.actualWorkDays * item.dailySalary + item.bonus - item.deduction;

      updated[index] = item;
      return updated;
    });
  };

  // Save single payroll record
  const handleSavePayroll = async (index: number, statusOverride?: 'draft' | 'paid') => {
    const item = payrolls[index];
    const statusToSave = statusOverride || item.status;
    const periodStr = selectedPeriod;
    try {
      const response = await api.post('/salaries', {
        employee: item.employee._id,
        periodName: periodStr,
        startDate: periodStartDate,
        endDate: periodEndDate,
        dailySalary: item.dailySalary,
        actualWorkDays: item.actualWorkDays,
        bonus: item.bonus,
        bonusNote: item.bonusNote || '',
        overtimeHours: item.overtimeHours || 0,
        overtimeRate: item.overtimeRate || 20000,
        deduction: item.deduction,
        deductionNote: item.deductionNote || '',
        latePenaltyCount: item.latePenaltyCount || 0,
        latePenaltyRate: item.latePenaltyRate || 10000,
        unauthorizedAbsenceCount: item.unauthorizedAbsenceCount || 0,
        unauthorizedAbsenceRate: item.unauthorizedAbsenceRate || 100000,
        totalSalary: item.totalSalary,
        status: statusToSave,
      });

      if (response.data.success) {
        // Mark as saved in local list
        setPayrolls((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            payrollId: response.data.data._id,
            status: statusToSave,
            isSaved: true,
          };
          return updated;
        });

        setAlertConfig({
          title: t('salary.savedSuccessTitle', 'Berhasil Disimpan'),
          message: statusToSave === 'paid'
            ? t('salary.paidSuccessDesc', 'Gaji untuk karyawan {{name}} berhasil dibayarkan.', { name: item.employee.name })
            : t('salary.saveSuccessDesc', 'Gaji untuk karyawan {{name}} berhasil disimpan.', { name: item.employee.name }),
          type: 'success',
        });
      }
    } catch (err: any) {
      setAlertConfig({
        title: t('salary.savedErrorTitle', 'Gagal Menyimpan Gaji'),
        message: err.response?.data?.message || t('salary.errorSaveDesc', 'Terjadi kesalahan saat menyimpan.'),
        type: 'error',
      });
    }
  };

  // Bulk save all payrolls
  const handleSaveAllPayrolls = async () => {
    let successCount = 0;
    const periodStr = selectedPeriod;

    for (let i = 0; i < payrolls.length; i++) {
      const item = payrolls[i];
      try {
        const response = await api.post('/salaries', {
          employee: item.employee._id,
          periodName: periodStr,
          startDate: periodStartDate,
          endDate: periodEndDate,
          dailySalary: item.dailySalary,
          actualWorkDays: item.actualWorkDays,
          bonus: item.bonus,
          bonusNote: item.bonusNote || '',
          overtimeHours: item.overtimeHours || 0,
          overtimeRate: item.overtimeRate || 20000,
          deduction: item.deduction,
          deductionNote: item.deductionNote || '',
          latePenaltyCount: item.latePenaltyCount || 0,
          latePenaltyRate: item.latePenaltyRate || 10000,
          unauthorizedAbsenceCount: item.unauthorizedAbsenceCount || 0,
          unauthorizedAbsenceRate: item.unauthorizedAbsenceRate || 100000,
          totalSalary: item.totalSalary,
          status: item.status,
        });

        if (response.data.success) {
          successCount++;
          // update state locally
          setPayrolls((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              payrollId: response.data.data._id,
              isSaved: true,
            };
            return updated;
          });
        }
      } catch (err) {
        console.error(`Failed to save payroll for index ${i}`, err);
      }
    }

    setAlertConfig({
      title: t('salary.bulkSaveFinished', 'Simpan Massal Selesai'),
      message: t('salary.bulkSaveDesc', '{{successCount}} dari {{totalCount}} gaji karyawan berhasil disimpan/diperbarui.', { successCount, totalCount: payrolls.length }),
      type: 'success',
    });
  };

  // Delete saved payroll (from history or calculator)
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const response = await api.delete(`/salaries/${deleteTarget}`);
      if (response.data.success) {
        setAlertConfig({
          title: t('salary.deleteSuccess', 'Berhasil Dihapus'),
          message: t('salary.deleteSuccessDesc', 'Data rekaman gaji berhasil dihapus dari sistem.'),
          type: 'success',
        });
        if (activeTab === 'history') {
          loadHistory();
        } else {
          handleCalculate();
        }
      }
    } catch (err: any) {
      setAlertConfig({
        title: t('salary.deleteFailed', 'Gagal Menghapus'),
        message: err.response?.data?.message || t('salary.deleteFailedDesc', 'Gagal menghapus rekaman gaji.'),
        type: 'error',
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  // Save Settings Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const response = await api.post('/salaries/config', {
        dailySalary: settingsDailySalary,
        monthlyHolidays: settingsHolidays,
        cutoffDay: settingsCutoff,
      });

      if (response.data.success) {
        setConfig(response.data.data);
        setAlertConfig({
          title: t('salary.configSaved', 'Pengaturan Disimpan'),
          message: t('salary.configSavedDesc', 'Pengaturan penggajian default berhasil diperbarui.'),
          type: 'success',
        });
        // Recalculate if we are in calculation view
        handleCalculate();
      }
    } catch (err: any) {
      setAlertConfig({
        title: t('salary.configSaveFailed', 'Gagal Menyimpan Pengaturan'),
        message: err.response?.data?.message || t('salary.configSaveFailedDesc', 'Gagal memperbarui konfigurasi gaji.'),
        type: 'error',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Filtered history
  const filteredHistory = historyPayrolls.filter((h) =>
    !historySearchQuery ||
    h.employee?.name?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    h.employee?.username?.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  // Helper date/currency formats
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatPeriodName = (period: string) => {
    if (!period) return '';
    const [year, month] = period.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
    return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateStr: string | Date) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Stats calculation
  const totalPayrollCost = payrolls.reduce((sum, item) => sum + item.totalSalary, 0);
  const totalPaidCost = payrolls.filter(item => item.status === 'paid').reduce((sum, item) => sum + item.totalSalary, 0);
  const totalWorkDaysSum = payrolls.reduce((sum, item) => sum + item.actualWorkDays, 0);
  const totalEmployeesCount = payrolls.length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="pb-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground transition-all duration-200">
            {t('salary.title', 'Manajemen Gaji Karyawan')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('salary.subtitle', 'Kelola gaji, absensi harian, libur bulanan, dan tanggal tutup buku.')}
          </p>
        </div>
      </div>

      {/* Tabs and Controls Layout (Combined) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 ">
        {/* Tabs Group */}
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('calculate')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${activeTab === 'calculate'
              ? 'bg-[#0A422D] text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Coins className="size-3.5" />
            <span>{t('salary.calculateTab', 'Hitung & Kelola Gaji')}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${activeTab === 'history'
              ? 'bg-[#0A422D] text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <History className="size-3.5" />
            <span>{t('salary.historyTab', 'Riwayat Penggajian')}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${activeTab === 'settings'
              ? 'bg-[#0A422D] text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Settings className="size-3.5" />
            <span>{t('salary.settingsTab', 'Pengaturan Parameter')}</span>
          </button>
        </div>

        {/* Right side controls, styled like ReportManagement */}
        <div className="flex flex-wrap items-center gap-3">
          {activeTab === 'calculate' && (
            <>
              {/* Select Period */}
              <input
                type="month"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#0A422D] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-sm max-w-[150px] cursor-pointer font-mono"
              />

              <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleCalculate}
                disabled={isCalculating}
                className="h-9 px-3 rounded-lg text-xs font-semibold cursor-pointer gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                {t('salary.refreshData', 'Segarkan')}
              </Button>

              <Button
                onClick={handleSaveAllPayrolls}
                disabled={payrolls.length === 0}
                className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer h-9 px-4 text-xs font-semibold rounded-lg shadow-sm gap-1.5"
              >
                <Save className="size-3.5" />
                {t('salary.saveAll', 'Simpan Semua')}
              </Button>

              <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={payrolls.length === 0}
                className="h-9 px-3 rounded-lg text-xs font-semibold cursor-pointer gap-1.5"
              >
                <FileDown className="size-3.5" />
                {t('salary.exportCSV', 'Export CSV')}
              </Button>
            </>
          )}

          {activeTab === 'history' && (
            <>
              <input
                type="month"
                value={historyPeriodFilter}
                onChange={(e) => setHistoryPeriodFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#0A422D] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-sm max-w-[150px] cursor-pointer font-mono"
              />

              <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                <Input
                  type="text"
                  placeholder={t('salary.searchEmployee', 'Cari karyawan...')}
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-lg border-zinc-200 dark:border-zinc-800"
                />
              </div>

              <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

              <Button
                variant="outline"
                size="sm"
                onClick={loadHistory}
                disabled={isHistoryLoading}
                className="h-9 px-3 rounded-lg text-xs font-semibold cursor-pointer gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                {t('salary.refreshHistory', 'Segarkan')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'calculate' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Executive Overview Dashboard Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="@container/card shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('salary.totalPayrollLabel', 'Total Biaya Gaji')}
                </CardDescription>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                  {formatRupiah(totalPayrollCost)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="gap-1 border-[#0A422D]/20 text-[#0A422D] bg-[#0A422D]/5 dark:text-[#4ADE80] dark:border-emerald-500/20">
                    <Wallet className="size-3" />
                    {t('salary.totalPayrollBadge', 'Biaya Gaji')}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="text-[11px] text-muted-foreground pt-2">
                {t('salary.payrollPeriodHelper', 'Draft & Lunas')}
              </CardFooter>
            </Card>

            <Card className="@container/card shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('salary.paidPayrollLabel', 'Gaji Terbayar (Lunas)')}
                </CardDescription>
                <CardTitle className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {formatRupiah(totalPaidCost)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="gap-1 border-emerald-500/20 text-emerald-600 bg-emerald-500/5 dark:text-emerald-400">
                    <Check className="size-3" />
                    {t('salary.paidPayrollBadge', 'Lunas')}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="text-[11px] text-muted-foreground pt-2">
                {t('salary.paidPayrollHelper', 'Pembayaran Selesai')}
              </CardFooter>
            </Card>

            <Card className="@container/card shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('salary.totalWorkdaysLabel', 'Akumulasi Hari Kerja')}
                </CardDescription>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                  {t('salary.daysCount', '{{count}} Hari', { count: totalWorkDaysSum })}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="gap-1 border-amber-500/20 text-amber-600 bg-amber-500/5 dark:text-amber-400">
                    <Briefcase className="size-3" />
                    {t('salary.totalWorkdaysBadge', 'Kerja')}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="text-[11px] text-muted-foreground pt-2">
                {t('salary.totalWorkdaysHelper', 'Semua kasir aktif')}
              </CardFooter>
            </Card>

            <Card className="@container/card shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t('salary.totalEmployeesLabel', 'Jumlah Kasir Aktif')}
                </CardDescription>
                <CardTitle className="text-2xl font-bold tracking-tight text-foreground mt-1 font-mono">
                  {t('salary.peopleCount', '{{count}} Orang', { count: totalEmployeesCount })}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline" className="gap-1 border-blue-500/20 text-blue-600 bg-blue-500/5 dark:text-blue-400">
                    <Users className="size-3" />
                    {t('salary.totalEmployeesBadge', 'Karyawan')}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="text-[11px] text-muted-foreground pt-2">
                {t('salary.totalEmployeesHelper', 'Peran Kasir')}
              </CardFooter>
            </Card>
          </div>

          {/* Period Date Display */}
          {periodStartDate && periodEndDate && (
            <div className="flex items-start md:items-center gap-3 bg-emerald-50/40 border border-emerald-100/60 dark:bg-emerald-950/5 dark:border-emerald-900/20 p-4 rounded-xl text-xs leading-relaxed">
              <Calendar className="size-4 text-[#0A422D] dark:text-[#4ADE80] shrink-0 mt-0.5 md:mt-0" />
              <div className="flex-1 text-foreground">
                {t('salary.periodLabel', 'Periode Gaji')}:{' '}
                <strong className="text-[#0A422D] dark:text-[#4ADE80] font-bold">
                  {formatDate(periodStartDate)}
                </strong>{' '}
                {t('salary.until', 'to')}{' '}
                <strong className="text-[#0A422D] dark:text-[#4ADE80] font-bold">
                  {formatDate(periodEndDate)}
                </strong>
                <span className="text-muted-foreground block md:inline md:ml-2">
                  ({t('salary.basedOnCutoff', 'Berdasarkan Tanggal Tutup Buku: Hari ke-{{day}} setiap bulan', { day: config.cutoffDay })})
                </span>
              </div>
            </div>
          )}

          {/* Payroll Calculator Table */}
          <Card className="shadow-sm border-border/50 overflow-hidden rounded-xl">
            <CardContent className="p-0 overflow-x-auto">
              {!isCalculating && payrolls.length === 0 ? (
                <div className="text-center py-20 text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Users className="size-10 text-muted-foreground/30" />
                  <span>{t('salary.noEmployees', 'Tidak ada data kasir/karyawan ditemukan.')}</span>
                </div>
              ) : (
                <Table className="min-w-[1000px] text-xs">
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                    <TableRow className="border-b border-border/60">
                      <TableHead className="w-[200px] font-bold pl-6">{t('salary.employeeName', 'Nama Karyawan')}</TableHead>
                      <TableHead className="w-[100px] text-center font-bold">{t('salary.workDays', 'Hari Kerja')}</TableHead>
                      <TableHead className="w-[120px] font-bold">{t('salary.dailySalary', 'Gaji Harian')}</TableHead>
                      <TableHead className="w-[110px] font-bold">{t('salary.bonus', 'Bonus')}</TableHead>
                      <TableHead className="w-[110px] font-bold">{t('salary.deduction', 'Potongan')}</TableHead>
                      <TableHead className="w-[130px] font-bold">{t('salary.totalSalary', 'Total Gaji')}</TableHead>
                      <TableHead className="w-[100px] text-center font-bold">{t('salary.status', 'Status')}</TableHead>
                      <TableHead className="w-[150px] text-right font-bold pr-6">{t('salary.actions', 'Aksi')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isCalculating ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={`skeleton-calc-${idx}`} className="animate-pulse border-b border-border/40">
                          <TableCell className="py-3 pl-6">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0" />
                              <div className="flex flex-col gap-1 w-24">
                                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                                <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-12 mx-auto" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-sm ww-12 mx-auto" />
                          </TableCell>
                          <TableCell className="py-3 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                              <div className="h-7 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : payrolls.map((p, idx) => (
                      <TableRow
                        key={p.employee._id}
                        className={`hover:bg-muted/15 border-b border-border/40 transition-colors ${p.isSaved ? 'bg-emerald-50/10 dark:bg-emerald-950/2' : ''
                          }`}
                      >
                        <TableCell className="font-semibold py-3 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-[#0A422D]/10 dark:bg-emerald-500/10 text-[#0A422D] dark:text-[#4ADE80] rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-[#0A422D]/10">
                              <User className="size-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground leading-tight">
                                {p.employee.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                @{p.employee.username}
                              </span>
                              {p.employee.bankName && p.employee.bankAccountNumber && (
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  {p.employee.bankName} ({p.employee.bankAccountNumber})
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 text-center font-bold text-foreground">
                          {t('salary.daysCountLower', '{{count}} hari', { count: p.actualWorkDays })}
                        </TableCell>

                        <TableCell className="py-3 font-mono font-semibold text-muted-foreground">
                          {formatRupiah(p.dailySalary)}
                        </TableCell>

                        <TableCell className="py-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {p.bonus > 0 ? `+${formatRupiah(p.bonus)}` : '-'}
                        </TableCell>

                        <TableCell className="py-3 font-mono font-semibold text-red-500">
                          {p.deduction > 0 ? `-${formatRupiah(p.deduction)}` : '-'}
                        </TableCell>

                        <TableCell className="font-bold text-[#0A422D] dark:text-[#4ADE80] text-[13px] whitespace-nowrap py-3 font-mono">
                          {formatRupiah(p.totalSalary)}
                        </TableCell>

                        <TableCell className="py-3 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-sm text-[9px] font-bold border ${p.status === 'paid'
                              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-450'
                              }`}
                          >
                            {p.status === 'paid' ? t('salary.paid', 'LUNAS') : t('salary.draft', 'DRAFT')}
                          </span>
                        </TableCell>

                        <TableCell className="text-right py-3 pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setSelectedPayrollIndexForCalculator(idx)}
                              className="h-7 px-2.5 gap-1 text-[10px] font-semibold rounded-md border-zinc-200 dark:border-zinc-800 cursor-pointer"
                            >
                              <Eye className="size-3" />
                              {t('salary.viewDetails', 'Detail')}
                            </Button>

                            {p.payrollId && (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                  const slip: SavedPayroll = {
                                    _id: p.payrollId!,
                                    employee: p.employee,
                                    periodName: selectedPeriod,
                                    startDate: periodStartDate,
                                    endDate: periodEndDate,
                                    dailySalary: p.dailySalary,
                                    actualWorkDays: p.actualWorkDays,
                                    holidaysCount: 0,
                                    bonus: p.bonus,
                                    bonusNote: p.bonusNote,
                                    overtimeHours: p.overtimeHours,
                                    overtimeRate: p.overtimeRate,
                                    deduction: p.deduction,
                                    deductionNote: p.deductionNote,
                                    latePenaltyCount: p.latePenaltyCount,
                                    latePenaltyRate: p.latePenaltyRate,
                                    unauthorizedAbsenceCount: p.unauthorizedAbsenceCount,
                                    unauthorizedAbsenceRate: p.unauthorizedAbsenceRate,
                                    totalSalary: p.totalSalary,
                                    status: p.status,
                                    paymentDate: p.paymentDate,
                                    createdAt: new Date().toISOString(),
                                  };
                                  setSlipPayroll(slip);
                                }}
                                className="h-7 px-2 gap-1 text-[10px] font-semibold rounded-md border-zinc-200 dark:border-zinc-800 cursor-pointer"
                              >
                                <Printer className="size-3" />
                                {t('salary.slipBtn', 'Slip')}
                              </Button>
                            )}

                            {p.status === 'draft' ? (
                              <Button
                                size="xs"
                                onClick={() => handleSavePayroll(idx, 'paid')}
                                className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer h-7 px-2.5 gap-1 text-[10px] font-semibold rounded-md"
                              >
                                <Check className="size-3" />
                                {t('salary.pay', 'Bayar')}
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => handleSavePayroll(idx, 'draft')}
                                className="border-green-200 bg-green-50/50 text-green-700 hover:bg-green-50 dark:border-green-900/30 dark:bg-green-950/10 dark:text-green-400 dark:hover:bg-green-950/20 cursor-pointer h-7 px-2.5 gap-1 text-[10px] font-semibold rounded-md shadow-sm"
                              >
                                <Check className="size-3 text-green-600 dark:text-green-400" />
                                {t('salary.paid', 'LUNAS')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <Card className="shadow-sm border-border/50 overflow-hidden rounded-xl">
            <CardContent className="p-0 overflow-x-auto">
              {!isHistoryLoading && filteredHistory.length === 0 ? (
                <div className="text-center py-20 text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Info className="size-10 text-muted-foreground/30" />
                  <span>{t('salary.noHistory', 'Tidak ada riwayat pembayaran gaji yang tersimpan untuk periode ini.')}</span>
                </div>
              ) : (
                <Table className="min-w-[1000px] text-xs">
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                    <TableRow className="border-b border-border/60">
                      <TableHead className="pl-6 font-bold">{t('salary.employeeName', 'Nama Karyawan')}</TableHead>
                      <TableHead className="font-bold">{t('salary.period', 'Periode')}</TableHead>
                      <TableHead className="text-center font-bold">{t('salary.workDays', 'Hari Kerja')}</TableHead>
                      <TableHead className="text-center font-bold">{t('salary.unauthorizedAbsence', 'Alpha')}</TableHead>
                      <TableHead className="font-bold">{t('salary.dailySalary', 'Gaji Harian')}</TableHead>
                      <TableHead className="font-bold">{t('salary.bonus', 'Bonus')}</TableHead>
                      <TableHead className="font-bold">{t('salary.deduction', 'Potongan')}</TableHead>
                      <TableHead className="font-bold">{t('salary.totalSalary', 'Total Gaji')}</TableHead>
                      <TableHead className="text-center font-bold">{t('salary.status', 'Status')}</TableHead>
                      <TableHead className="text-right pr-6 font-bold">{t('salary.actions', 'Aksi')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isHistoryLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={`skeleton-history-${idx}`} className="animate-pulse border-b border-border/40">
                          <TableCell className="py-3 pl-6">
                            <div className="flex items-center gap-2.5">
                              <div className="size-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0" />
                              <div className="flex flex-col gap-1 w-24">
                                <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                                <div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-1 w-16">
                              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
                              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-12 mx-auto" />
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-12 mx-auto" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-12 mx-auto" />
                          </TableCell>
                          <TableCell className="py-3 pr-6 text-right">
                            <div className="h-7 w-7 bg-zinc-200 dark:bg-zinc-800 rounded-md ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredHistory.map((h) => (
                      <TableRow key={h._id} className="hover:bg-muted/10 border-b border-border/40 transition-colors">
                        <TableCell className="font-semibold py-3 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 bg-[#0A422D]/10 dark:bg-emerald-500/10 text-[#0A422D] dark:text-[#4ADE80] rounded-xl flex items-center justify-center shrink-0 border border-[#0A422D]/10">
                              <User className="size-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground leading-tight">
                                {h.employee?.name || t('salary.employeeDeleted', 'Karyawan Dihapus')}
                              </span>
                              {h.employee && (
                                <>
                                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                    @{h.employee.username}
                                  </span>
                                  {h.employee.bankName && h.employee.bankAccountNumber && (
                                    <span className="text-[10px] text-muted-foreground mt-0.5">
                                      {h.employee.bankName} ({h.employee.bankAccountNumber})
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="py-3">
                          <div className="flex flex-col font-mono text-[10px] text-muted-foreground leading-tight">
                            <span className="font-bold text-foreground">
                              {formatPeriodName(h.periodName)}
                            </span>
                            <span className="mt-0.5 text-[9px] opacity-80">
                              {formatDate(h.startDate).split(' ').slice(0, 2).join(' ')} -{' '}
                              {formatDate(h.endDate)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center font-bold py-3 text-foreground">
                          {t('salary.daysCountLower', '{{count}} hari', { count: h.actualWorkDays })}
                        </TableCell>

                        <TableCell className="text-center text-muted-foreground py-3">
                          -
                        </TableCell>

                        <TableCell className="font-mono py-3 font-semibold">{formatRupiah(h.dailySalary)}</TableCell>

                        <TableCell className="font-mono py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          {h.bonus > 0 ? `+${formatRupiah(h.bonus)}` : '-'}
                        </TableCell>

                        <TableCell className="font-mono py-3 font-semibold text-red-500">
                          {h.deduction > 0 ? `-${formatRupiah(h.deduction)}` : '-'}
                        </TableCell>

                        <TableCell className="font-bold text-foreground text-sm py-3 font-mono">
                          {formatRupiah(h.totalSalary)}
                        </TableCell>

                        <TableCell className="text-center py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold border ${h.status === 'paid'
                              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-450'
                              }`}
                          >
                            {h.status === 'paid' ? t('salary.paid', 'LUNAS') : t('salary.draft', 'DRAFT')}
                          </span>
                        </TableCell>

                        <TableCell className="text-right py-3 pr-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setSlipPayroll(h)}
                              className="h-7 px-2 gap-1 text-[10px] font-semibold rounded-md border-zinc-200 dark:border-zinc-800 cursor-pointer"
                            >
                              <Printer className="size-3" />
                              {t('salary.slipBtn', 'Slip')}
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="destructive"
                              className="cursor-pointer rounded-md h-7 w-7"
                              onClick={() => setDeleteTarget(h._id)}
                              title={t('salary.delete', 'Hapus')}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <Card className="lg:col-span-2 shadow-sm border-border/50 rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <h2 className="text-md font-bold text-foreground mb-5 flex items-center gap-2">
                <Settings className="size-4 text-[#0A422D] dark:text-[#4ADE80]" />
                {t('salary.settingsTitle', 'Konfigurasi Parameter Penggajian')}
              </h2>

              <form onSubmit={handleSaveConfig} className="flex flex-col gap-5 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="settings-salary" className="font-bold text-foreground">
                      {t('salary.defaultDaily', 'Gaji Perhari Default (Rupiah)')}
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        id="settings-salary"
                        type="text"
                        required
                        className="pl-9 h-9 font-bold rounded-lg border-zinc-200 dark:border-zinc-800"
                        value={formatInputNumber(settingsDailySalary)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                        onChange={(e) => setSettingsDailySalary(parseInputNumber(e.target.value))}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground/80 leading-relaxed">
                      {t('salary.dailySalaryDesc', 'Gaji standar per hari kerja kasir (default saat ini: Rp 85.000)')}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="settings-holidays" className="font-bold text-foreground">
                      {t('salary.defaultHolidays', 'Batas Hari Libur Per Bulan')}
                    </Label>
                    <Input
                      id="settings-holidays"
                      type="number"
                      required
                      min={0}
                      className="h-9 font-bold rounded-lg border-zinc-200 dark:border-zinc-800"
                      value={settingsHolidays === 0 ? '' : settingsHolidays}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      onChange={(e) => setSettingsHolidays(parseInt(e.target.value) || 0)}
                    />
                    <span className="text-[10px] text-muted-foreground/80 leading-relaxed">
                      {t('salary.monthlyHolidaysDesc', 'Jumlah hari libur standar yang diizinkan dalam sebulan (default: 4 hari)')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 max-w-sm">
                  <Label htmlFor="settings-cutoff" className="font-bold text-foreground">
                    {t('salary.cutoffDayLabel', 'Tanggal Tutup Buku (Tanggal Cut-off)')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="settings-cutoff"
                      type="number"
                      required
                      min={1}
                      max={31}
                      className="h-9 font-bold pr-20 rounded-lg border-zinc-200 dark:border-zinc-800"
                      value={settingsCutoff === 0 ? '' : settingsCutoff}
                      onFocus={(e) => e.target.select()}
                      placeholder="0"
                      onChange={(e) => setSettingsCutoff(parseInt(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-semibold">
                      {t('salary.everyMonth', 'tiap bulan')}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground/80 leading-relaxed">
                    {t('salary.cutoffDayDesc', 'Menentukan akhir periode perhitungan gaji. Contoh: 25 berarti siklus gaji adalah tanggal 26 bulan lalu s.d. tanggal 25 bulan ini.')}
                  </span>
                </div>

                <div className="pt-4 border-t border-border flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingConfig}
                    className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer h-9 px-5 text-xs font-semibold rounded-lg shadow-sm"
                  >
                    {isSavingConfig ? t('salary.saving', 'Menyimpan...') : t('salary.saveSettings', 'Simpan Perubahan')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Regulations Card */}
          <Card className="shadow-sm border-border/50 bg-[#0A422D]/5 dark:bg-emerald-950/5 rounded-xl overflow-hidden">
            <CardContent className="p-6 flex flex-col gap-4 text-xs leading-relaxed text-muted-foreground">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                <Info className="size-4 text-[#0A422D] dark:text-[#4ADE80]" />
                {t('salary.provisionsTitle', 'Ketentuan Penggajian')}
              </h3>

              <ul className="flex flex-col gap-3 list-disc list-inside">
                <li>
                  {t('salary.provision1', 'Gaji Harian (Rp 85.000): Dihitung berdasarkan kehadiran aktif per hari.')}
                </li>
                <li>
                  {t('salary.provision2', 'Perhitungan Kehadiran: Sistem mendeteksi otomatis hari kehadiran berdasarkan shift kerja kasir yang closed (selesai) pada periode berjalan.')}
                </li>
                <li>
                  {t('salary.provision3', 'Libur 4 Hari Sebulan: Kuota libur kasir. Admin dapat mengaktifkan opsi \'Libur Berbayar\' per karyawan jika hari libur tersebut tetap ingin digaji penuh.')}
                </li>
                <li>
                  {t('salary.provision4', 'Siklus Cut-off: Membantu sinkronisasi tutup buku keuangan cafe secara periodik dan teratur.')}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              {t('salary.confirmDeleteTitle', 'Hapus Data Penggajian?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('salary.confirmDeleteDesc', 'Apakah Anda yakin ingin menghapus data penggajian ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>{t('salary.cancel', 'Batal')}</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-600/90 text-white cursor-pointer"
                onClick={handleDeleteConfirm}
              >
                {t('salary.confirmDeleteBtn', 'Hapus Permanen')}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Calculator Dialog */}
      {selectedPayrollIndexForCalculator !== null && (
        (() => {
          const idx = selectedPayrollIndexForCalculator;
          const p = payrolls[idx];
          if (!p) return null;
          return (
            <Dialog
              open={selectedPayrollIndexForCalculator !== null}
              onOpenChange={(open) => {
                if (!open) setSelectedPayrollIndexForCalculator(null);
              }}
            >
              <DialogContent className="sm:max-w-3xl sm:p-6 sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calculator className="size-5 text-[#0A422D] dark:text-[#4ADE80]" />
                    {t('salary.calculatorTitle', 'Kalkulator Gaji')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('salary.calculatorDesc', 'Hitung dan edit parameter rincian gaji untuk {{name}}.', { name: p.employee.name })}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 my-2 text-xs">
                  <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-border/50">
                      <div className="size-10 bg-[#0A422D]/10 dark:bg-emerald-500/10 text-[#0A422D] dark:text-[#4ADE80] rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#0A422D]/10">
                        <User className="size-5" />
                      </div>
                      <div className="flex flex-col">
                         <span className="font-bold text-sm text-foreground leading-tight">
                           {p.employee.name}
                         </span>
                         <span className="text-xs text-muted-foreground font-mono mt-0.5">
                           @{p.employee.username}
                         </span>
                         {p.employee.bankName && p.employee.bankAccountNumber && (
                           <span className="text-[11px] text-muted-foreground mt-0.5">
                             {p.employee.bankName} ({p.employee.bankAccountNumber})
                           </span>
                         )}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="font-bold text-foreground">
                          {t('salary.workDays', 'Hari Kerja')}
                        </Label>
                        <Input
                          type="number"
                          className="h-9 font-semibold rounded-lg border-zinc-200 dark:border-zinc-800"
                          value={p.actualWorkDays === 0 ? '' : p.actualWorkDays}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          onChange={(e) =>
                            handlePayrollChange(idx, 'actualWorkDays', e.target.value)
                          }
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="font-bold text-foreground">
                          {t('salary.dailySalary', 'Gaji Harian')}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-semibold">Rp</span>
                          <Input
                            type="text"
                            disabled
                            className="h-9 pl-8 font-bold font-mono rounded-lg border-zinc-200 dark:border-zinc-800 bg-muted/40 cursor-not-allowed opacity-80"
                            value={formatInputNumber(p.dailySalary)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="font-bold text-foreground">
                          {t('salary.unauthorizedAbsence', 'Alpha (Tanpa Izin)')}
                        </Label>
                        <Input
                          type="number"
                          className="h-9 font-semibold rounded-lg border-zinc-200 dark:border-zinc-800"
                          value={p.unauthorizedAbsenceCount === 0 ? '' : p.unauthorizedAbsenceCount}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          onChange={(e) =>
                            handlePayrollChange(idx, 'unauthorizedAbsenceCount', e.target.value)
                          }
                        />
                        <span className="text-[10px] text-red-500 font-semibold">
                          {formatRupiah(p.unauthorizedAbsenceRate)}{t('salary.perAlpha', '/alpha')}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="font-bold text-foreground">
                          {t('salary.latePenalty', 'Terlambat (Kali)')}
                        </Label>
                        <Input
                          type="number"
                          className="h-9 font-semibold rounded-lg border-zinc-200 dark:border-zinc-800"
                          value={p.latePenaltyCount === 0 ? '' : p.latePenaltyCount}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          onChange={(e) =>
                            handlePayrollChange(idx, 'latePenaltyCount', e.target.value)
                          }
                        />
                        <span className="text-[10px] text-red-500 font-semibold">
                          {formatRupiah(p.latePenaltyRate)}{t('salary.perLate', '/late')}
                        </span>
                      </div>

                    </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <Label className="font-bold text-foreground">
                            {t('salary.bankName', 'Nama Bank')}
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g. BCA"
                            className="h-9 font-semibold rounded-lg border-zinc-200 dark:border-zinc-800"
                            value={p.employee.bankName || ''}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setPayrolls((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? { ...item, employee: { ...item.employee, bankName: newVal } }
                                    : item
                                )
                              );
                            }}
                            onBlur={(e) => {
                              handleUpdateBankInfo(p.employee._id, e.target.value, p.employee.bankAccountNumber || '');
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="font-bold text-foreground">
                            {t('salary.bankAccount', 'No. Rekening')}
                          </Label>
                          <Input
                            type="text"
                            placeholder="e.g. 1234567890"
                            className="h-9 font-semibold rounded-lg border-zinc-200 dark:border-zinc-800"
                            value={p.employee.bankAccountNumber || ''}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setPayrolls((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? { ...item, employee: { ...item.employee, bankAccountNumber: newVal } }
                                    : item
                                )
                              );
                            }}
                            onBlur={(e) => {
                              handleUpdateBankInfo(p.employee._id, p.employee.bankName || '', e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label className="font-bold text-foreground">
                          {t('salary.overtime', 'Lembur (Jam)')}
                        </Label>
                        <Input
                          type="number"
                          className="h-9 font-semibold rounded-lg border-zinc-200 dark:border-zinc-800 w-full"
                          value={p.overtimeHours === 0 ? '' : p.overtimeHours}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          onChange={(e) =>
                            handlePayrollChange(idx, 'overtimeHours', e.target.value)
                          }
                        />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatRupiah(p.overtimeRate)}{t('salary.perHour', '/jam')} = {formatRupiah(p.bonus)}
                        </span>
                      </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col gap-4 justify-between">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <Label className="font-bold text-foreground">
                          {t('salary.status', 'Status')}
                        </Label>
                        <div className="relative">
                          <select
                            value={p.status}
                            onChange={(e) => handlePayrollChange(idx, 'status', e.target.value)}
                            className={`h-9 w-full rounded-lg border px-3 text-xs font-bold cursor-pointer appearance-none pr-8 transition-all ${p.status === 'paid'
                              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-450'
                              }`}
                          >
                            <option value="draft">{t('salary.draft', 'DRAFT')}</option>
                            <option value="paid">{t('salary.paid', 'LUNAS')}</option>
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>

                      <div className="bg-[#0A422D]/5 dark:bg-emerald-950/10 border border-[#0A422D]/10 rounded-xl p-3.5 flex flex-col gap-1.5">
                        <span className="font-bold text-foreground">{t('salary.calcDetails', 'Rincian Perhitungan:')}</span>
                        <div className="flex flex-col gap-1 text-muted-foreground font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span>
                              {t('salary.calcBaseSalary', 'Gaji Pokok')}:
                              {` ${p.actualWorkDays} ${t('salary.daysShortcut', 'hari')} x ${formatRupiah(p.dailySalary)}`}
                            </span>
                            <span className="text-foreground">
                              {formatRupiah(p.actualWorkDays * p.dailySalary)}
                            </span>
                          </div>
                          {(p.overtimeHours || 0) > 0 && (
                            <div className="flex flex-col text-emerald-600 dark:text-emerald-400">
                              <div className="flex justify-between">
                                <span>{t('salary.calcOvertime', 'Lembur')}:</span>
                                <span>+{formatRupiah(p.bonus)}</span>
                              </div>
                              <span className="text-[10px] italic opacity-70">
                                {t('salary.overtimeDetail', '{{hours}} jam x {{rate}}', { hours: p.overtimeHours, rate: `Rp ${formatInputNumber(p.overtimeRate)}` })}
                              </span>
                              {p.bonusNote && (
                                <span className="text-[10px] italic opacity-70">{p.bonusNote}</span>
                              )}
                            </div>
                          )}
                          {(p.latePenaltyCount || 0) > 0 && (
                            <div className="flex flex-col text-red-500">
                              <div className="flex justify-between">
                                <span>{t('salary.calcLatePenalty', 'Terlambat')}:</span>
                                <span>-{formatRupiah(p.latePenaltyCount * p.latePenaltyRate)}</span>
                              </div>
                              <span className="text-[10px] italic opacity-70">
                                {t('salary.lateDetail', '{{count}}x {{rate}}', { count: p.latePenaltyCount, rate: formatRupiah(p.latePenaltyRate) })}
                              </span>
                            </div>
                          )}
                          {(p.unauthorizedAbsenceCount || 0) > 0 && (
                            <div className="flex flex-col text-red-500">
                              <div className="flex justify-between">
                                <span>{t('salary.calcUnauthorizedAbsence', 'Alpha')}:</span>
                                <span>-{formatRupiah(p.unauthorizedAbsenceCount * p.unauthorizedAbsenceRate)}</span>
                              </div>
                              <span className="text-[10px] italic opacity-70">
                                {t('salary.alphaDetail', '{{count}}x {{rate}}', { count: p.unauthorizedAbsenceCount, rate: formatRupiah(p.unauthorizedAbsenceRate) })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="h-px bg-border/60 my-1" />
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#0A422D] dark:text-[#4ADE80]">{t('salary.totalSalary', 'Total Gaji')}:</span>
                          <span className="font-extrabold text-sm font-mono text-[#0A422D] dark:text-[#4ADE80]">{formatRupiah(p.totalSalary)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex justify-between items-center sm:justify-between mt-4 border-t pt-4">
                  <div>
                    {p.payrollId ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setDeleteTarget(p.payrollId);
                          setSelectedPayrollIndexForCalculator(null);
                        }}
                        className="cursor-pointer gap-1.5 h-9"
                      >
                        <Trash2 className="size-3.5" />
                        {t('salary.delete', 'Hapus')}
                      </Button>
                    ) : (
                      <div />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedPayrollIndexForCalculator(null)}
                      className="cursor-pointer h-9 text-xs"
                    >
                      {t('salary.close', 'Tutup')}
                    </Button>
                    <Button
                      type="button"
                      className="cursor-pointer bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer h-9 text-xs gap-1.5"
                      onClick={async () => {
                        await handleSavePayroll(idx);
                        setSelectedPayrollIndexForCalculator(null);
                      }}
                    >
                      <Save className="size-3.5" />
                      {t('salary.save', 'Simpan')}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          );
        })()
      )}

      {/* Alert Dialog (Success / Error / Info Notifications) */}
      <AlertDialog open={alertConfig !== null} onOpenChange={(open) => !open && setAlertConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertConfig?.type === 'success' ? (
                <div className="size-5 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center shrink-0">
                  <Check className="size-3.5 stroke-[3]" />
                </div>
              ) : (
                <AlertTriangle className="size-5 text-red-500" />
              )}
              {alertConfig?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertConfig?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button
                className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer"
                onClick={() => setAlertConfig(null)}
              >
                {t('salary.ok', 'OK')}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Salary Slip Modal */}
      {slipPayroll && (
        <SalarySlipModal
          payroll={slipPayroll}
          onClose={() => setSlipPayroll(null)}
        />
      )}
    </div>
  );
};

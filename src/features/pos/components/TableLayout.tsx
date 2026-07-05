import React, { useState, useEffect, useCallback } from 'react';
// import { useOrder } from '../../order/context/OrderContext';
import { cn } from 'src/lib/utils';
import { useTranslation } from '../../../hooks/useTranslation';
import { Armchair, Users, CheckCircle, Unlock } from 'lucide-react';
import api from '../../../api';

interface TableData {
  _id: string;
  name: string;
  label: string;
  capacity: number;
  zone: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  shape: 'square' | 'round' | 'rectangle';
  currentOrder: any;
  active: boolean;
}

interface TableLayoutProps {
  onSelectTable: (table: TableData) => void;
  onFreeTable?: (table: TableData) => Promise<void>;
  selectedTableId?: string;
}

const TABLE_STATUS_STYLE: Record<string, { bg: string; border: string; icon: string }> = {
  available: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-300 dark:border-emerald-700',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  occupied: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-300 dark:border-red-700',
    icon: 'text-red-600 dark:text-red-400',
  },
  reserved: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-300 dark:border-amber-700',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  maintenance: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-600',
    icon: 'text-gray-400 dark:text-gray-500',
  },
};

export const TableLayout: React.FC<TableLayoutProps> = ({ onSelectTable, onFreeTable, selectedTableId }) => {
  const { t } = useTranslation();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const fetchTables = useCallback(async () => {
    try {
      const res = await api.get('/tables', { params: { active: 'true' } });
      if (res.data.success) setTables(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tables', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const zones = ['all', ...new Set(tables.map(t => t.zone))];
  const filteredTables = tables.filter(t => selectedZone === 'all' || t.zone === selectedZone);

  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-7 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Armchair className="size-4 text-[#0A422D] dark:text-[#4ADE80]" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('pos.tableLayout', 'Table Layout')}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="size-2 bg-emerald-500 rounded-full" /> {availableCount} {t('pos.available', 'Avail')}
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span className="size-2 bg-red-500 rounded-full" /> {occupiedCount} {t('pos.occupied', 'Occ')}
          </span>
        </div>
      </div>

      {/* Zone Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {zones.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap",
              selectedZone === zone
                ? "bg-[#0A422D] text-white dark:bg-[#4ADE80] dark:text-[#1C1C19]"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:bg-gray-200"
            )}
          >
            {zone === 'all' ? t('pos.all', 'All') : zone.charAt(0).toUpperCase() + zone.slice(1)}
          </button>
        ))}
      </div>

      {/* Table Grid */}
      <div className="max-h-22 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-6 gap-1.5 pt-1">
          {filteredTables.map(table => {
          const style = TABLE_STATUS_STYLE[table.status];
          const isSelected = selectedTableId === table._id;
          const isClickable = table.status === 'available' || (isSelected && table.status !== 'maintenance');

          return (
            <div
              key={table._id}
              onClick={() => isClickable && onSelectTable(table)}
              className={cn(
                "relative flex flex-col items-center justify-center p-1.5 rounded border-2 transition-all select-none",
                isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                isSelected
                  ? "border-[#0A422D] bg-[#0A422D]/5 dark:border-[#4ADE80] dark:bg-[#4ADE80]/5 ring-2 ring-[#0A422D]/20 dark:ring-[#4ADE80]/20"
                  : `${style.bg} ${style.border}`
              )}
            >
              <span className={cn("text-[10px] font-black leading-tight", isSelected ? "text-[#0A422D] dark:text-[#4ADE80]" : style.icon)}>
                {table.label}
              </span>
              <span className="text-[7px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-0.5">
                {table.status === 'occupied' ? 'Terisi' : table.status === 'reserved' ? 'Reservasi' : <><Users className="size-1.5" /> {table.capacity}</>}
              </span>
              {table.status === 'occupied' && table.currentOrder && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await onFreeTable?.(table);
                    setTables(prev => prev.map(t => t._id === table._id ? { ...t, status: 'available', currentOrder: null } : t));
                  }}
                  className="absolute -top-1.5 -right-1.5 size-3.5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center cursor-pointer z-10 transition-colors"
                  title="Free Table"
                >
                  <Unlock className="size-2 text-white" />
                </button>
              )}
              {isSelected && (
                <div className="absolute -top-1 -right-1 size-2.5 bg-[#0A422D] dark:bg-[#4ADE80] rounded-full flex items-center justify-center">
                  <CheckCircle className="size-1.5 text-white dark:text-[#1C1C19]" />
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>

      {filteredTables.length === 0 && (
        <div className="text-center py-6 text-xs text-gray-400 font-medium">
          {t('pos.noTables', 'No tables available in this zone')}
        </div>
      )}
    </div>
  );
};

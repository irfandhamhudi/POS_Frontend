import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useTranslation } from '../../../hooks/useTranslation';

interface CustomerDetailsProps {
  customerName: string;
  onNameChange: (name: string) => void;
  tableNumber: string;
  onTableChange: (table: string) => void;
  showTable: boolean;
}

export const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customerName,
  onNameChange,
  tableNumber,
  onTableChange,
  showTable,
}) => {
  const { t } = useTranslation();
  const tables = [
    'A1 - Indoor',
    'A2 - Indoor',
    'B12 - Indoor',
    'B14 - Outdoor',
    'C3 - Rooftop',
    'C4 - Rooftop',
    'Bar - Counter',
  ];

  return (
    <div className="grid grid-cols-2 gap-3 text-left">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="customer-name" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {t('pos.customerName')}
        </Label>
        <Input
          id="customer-name"
          type="text"
          placeholder={t('pos.enterName')}
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-10 bg-white border border-[#EBEAE4] rounded-xl focus-visible:border-[#0A422D] focus-visible:ring-[#0A422D]/20 text-sm font-semibold"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="table-select" className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          {t('pos.table')}
        </Label>
        {showTable ? (
          <Select value={tableNumber} onValueChange={onTableChange}>
            <SelectTrigger id="table-select" className="w-full h-10 data-[size=default]:h-10 bg-white border border-[#EBEAE4] rounded-xl focus-visible:border-[#0A422D] focus-visible:ring-[#0A422D]/20 text-sm font-semibold">
              <SelectValue placeholder={t('pos.selectTable')} />
            </SelectTrigger>
            <SelectContent className="p-3 bg-white border border-[#EBEAE4] rounded-xl">
              {tables.map((table) => (
                <SelectItem key={table} value={table} className="text-sm font-medium hover:bg-gray-50 cursor-pointer">
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="h-10 flex items-center px-4 bg-gray-50 border border-dashed border-[#EBEAE4] text-gray-400 text-xs font-semibold rounded-xl select-none">
            {t('pos.notApplicable')}
          </div>
        )}
      </div>
    </div>
  );
};

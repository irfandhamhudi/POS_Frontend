import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '../../../hooks/useTranslation';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
        <Search className="size-5" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        placeholder={t('menu.searchPlaceholder', 'Search')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            if (value) {
              onChange('');
            } else {
              inputRef.current?.blur();
            }
          }
        }}
        className="w-full h-12 pl-12 pr-16 bg-white border border-[#EBEAE4] hover:border-gray-300 focus-visible:border-[#0A422D] focus-visible:ring-[#0A422D]/20 rounded-lg text-sm font-medium transition-all"
      />
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
        <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-0.5 rounded-lg border border-[#EBEAE4] bg-[#FAF9F5] px-1.5 font-sans text-[10px] font-bold text-gray-400">
          <span className="text-[9px]">Ctrl</span>
          <span>+</span>
          <span>K</span>
        </kbd>
      </div>
    </div>
  );
};

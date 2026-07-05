import React, { useState, useEffect } from 'react';
import { Moon, Sun, Printer, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useOrder } from '../../order/context/OrderContext';
import { useTranslation } from '../../../hooks/useTranslation';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const { addNotification } = useOrder();
  const { t, i18n, currentLanguage } = useTranslation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
    addNotification(
      t('notifications.themeUpdatedTitle'),
      !isDarkMode ? t('notifications.themeEnabledDesc') : t('notifications.themeDisabledDesc'),
      'warning'
    );
  };

  const [autoPrint, setAutoPrint] = useState(true);

  const handleLanguageChange = (lang: 'en' | 'id') => {
    if (currentLanguage === lang) return;
    i18n.changeLanguage(lang);
    addNotification(
      t('notifications.langUpdatedTitle'),
      t(`notifications.langUpdatedDesc_${lang}`),
      'info'
    );
  };

  const toggleAutoPrint = () => {
    setAutoPrint((prev) => {
      const newVal = !prev;
      addNotification(
        t('notifications.printUpdatedTitle'),
        newVal ? t('notifications.printEnabledDesc') : t('notifications.printDisabledDesc'),
        'info'
      );
      return newVal;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white border border-[#EBEAE4] rounded-lg p-6 text-left shadow-xl">
        <DialogHeader className="border-b border-[#EBEAE4] pb-4">
          <DialogTitle className="text-lg font-black text-[#0A422D] tracking-tight leading-none">{t('settings.title')}</DialogTitle>
          <DialogDescription className="text-gray-500 font-medium text-xs mt-1 block">
            {t('settings.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 text-xs font-semibold text-gray-700">
          {/* Setting 1: Theme selection */}
          <div className="flex justify-between items-center p-3 bg-gray-50/50 border border-[#EBEAE4] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-gray-150 rounded-lg text-gray-600">
                {isDarkMode ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900">{t('settings.darkTheme')}</span>
                <span className="text-[10px] text-gray-400 font-medium">{t('settings.darkThemeDesc')}</span>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer outline-none ${isDarkMode ? 'bg-[#0A422D]' : 'bg-gray-200'
                }`}
            >
              <div
                className={`size-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {/* Setting 2: Language */}
          <div className="flex justify-between items-center p-3 bg-gray-50/50 border border-[#EBEAE4] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-gray-150 rounded-lg text-gray-600">
                <Globe className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900">{t('settings.systemLanguage')}</span>
                <span className="text-[10px] text-gray-400 font-medium">{t('settings.systemLanguageDesc')}</span>
              </div>
            </div>
            <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold cursor-pointer transition-all ${currentLanguage === 'en' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('id')}
                className={`px-3 py-1 rounded-md text-[10px] font-extrabold cursor-pointer transition-all ${currentLanguage === 'id' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                  }`}
              >
                ID
              </button>
            </div>
          </div>

          {/* Setting 3: Auto print receipt */}
          <div className="flex justify-between items-center p-3 bg-gray-50/50 border border-[#EBEAE4] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-gray-150 rounded-lg text-gray-600">
                <Printer className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-gray-900">{t('settings.autoPrint')}</span>
                <span className="text-[10px] text-gray-400 font-medium">{t('settings.autoPrintDesc')}</span>
              </div>
            </div>
            <button
              onClick={toggleAutoPrint}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer outline-none ${autoPrint ? 'bg-[#0A422D]' : 'bg-gray-200'
                }`}
            >
              <div
                className={`size-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${autoPrint ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

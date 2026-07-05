import { useState, useEffect } from 'react';
import i18n from '@/lib/i18n';

export function useTranslation() {
  const [lng, setLng] = useState(i18n.language || 'en');

  useEffect(() => {
    const handleLanguageChanged = (newLng: string) => {
      setLng(newLng);
    };

    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  function t(key: string): string;
  function t(key: string, defaultValue: string): string;
  function t(key: string, options: Record<string, any>): string;
  function t(key: string, defaultValue: string, options: Record<string, any>): string;
  function t(
    key: string,
    defaultValueOrOptions?: string | Record<string, any>,
    options?: Record<string, any>
  ): string {
    if (typeof defaultValueOrOptions === 'object') {
      return i18n.t(key, defaultValueOrOptions);
    }
    if (options) {
      return i18n.t(key, defaultValueOrOptions, options);
    }
    return i18n.t(key, defaultValueOrOptions);
  }

  return {
    t,
    i18n,
    currentLanguage: lng,
  };
}

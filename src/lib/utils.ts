import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number): string => {
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? '-' : '';
  const formatted = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}Rp ${formatted}`;
};

export const formatNumberInput = (value: string): string => {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const unformatNumberInput = (value: string): string => {
  return value.replace(/\./g, '');
};


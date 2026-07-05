import type { Product } from '../../menu/types';

export type OrderType = 'dine_in' | 'take_away' | 'order_online';
export type ItemSize = 'small' | 'medium' | 'large';

export interface CartItem {
  product: Product;
  quantity: number;
  size: ItemSize;
  notes: string;
}

export interface Transaction {
  _id?: string;
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderType: OrderType;
  customerName: string;
  tableNumber: string;
  timestamp: string;
  date?: string;
  paymentMethod?: 'cash' | 'card' | 'qris';
  amountPaid?: number;
  change?: number;
  status?: 'completed' | 'cancelled' | 'pending';
  cancelReason?: string;
  couponCode?: string;
  discount?: number;
  shift?: string;
  createdAt?: string;
}

export interface HeldOrder {
  id: string;
  cart: CartItem[];
  customerName: string;
  tableNumber: string;
  orderType: OrderType;
  total: number;
  timestamp: string;
}

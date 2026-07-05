export type CategoryType = 'coffee' | 'tea' | 'snack' | 'main_course';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: CategoryType;
  available: boolean;
  stockCount: number;
  needRestock?: boolean;
}

export interface Category {
  id: CategoryType;
  name: string;
  itemCount: number;
  available: boolean;
  needRestock?: boolean;
}

// types/index.ts
export type UserRole = 'master' | 'manager' | 'casher';

export interface AppUser {
  uid: string;
  role: UserRole;
}

export type SalesFilter = '어제' | '오늘' | '이번 주' | '이번 달' | '직접 선택';

export interface Category {
  docId?: string;
  id: number;
  name: string;
  enabled: boolean;
  inOrders?: boolean;
}

export interface MenuItem {
  docId?: string;
  id: number;
  name: string;
  salesPrice: number;
  purchasePrice: number;
  category: string;
  quantity?: number;
  remainingStock: number;
  totalStock: number;
}

export interface Order {
  id: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: string;
  timestamp: Date;
  isExpense?: boolean;
  purchaseTotal?: number;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  amount: number;
}

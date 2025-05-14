// src/types/inventory.ts
export interface InventoryRecord {
  id: string;
  productId: string;
  productName: string;
  type: string; // '입고' | '출고' | '초기화'
  reason: string; // '주문' | '주문 취소' | '오기입' | '폐기' 등
  adjustment: number;
  afterStock: number;
  timestamp: string;
  orderId?: string; // 주문 관련 기록인 경우 주문 ID 저장
}

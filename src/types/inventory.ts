// src/types/inventory.ts
export interface InventoryRecord {
    id?: string;
    productId: string;
    productName: string;
    timestamp: any; // Firestore Timestamp
    type: '입고' | '출고' | '초기화';
    reason: string;
    adjustment: number;
    afterStock: number;
  }
  
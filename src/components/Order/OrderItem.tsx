import React from 'react';
import { MenuItem } from '../../types';

interface OrderItemProps {
  item: MenuItem;
  addToOrder: (item: MenuItem) => void;
  disabled: boolean;
}

const OrderItem: React.FC<OrderItemProps> = ({ item, addToOrder, disabled }) => {
  const ratio = item.totalStock > 0 ? item.remainingStock / item.totalStock : 0;
  const stockPercentage = ratio > 0 ? ((item.remainingStock / item.totalStock) * 100).toFixed(0) : 0;
  
  return (
    <button
      className={`p-3 border rounded-lg flex flex-col h-32 relative ${
        item.remainingStock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={() => addToOrder(item)}
      disabled={disabled || item.remainingStock <= 0}
    >
      {/* 상품명 */}
      <div className="font-medium mb-2 text-left">{item.name}</div>
      {/* 가로 재고 바 */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-auto mb-1">
        <div
          className={`h-full ${ratio > 0.5 ? 'bg-green-500' : ratio > 0.2 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{
            width: `${stockPercentage}%`
          }}
        />
      </div>
      {/* 남은 재고 개수 */}
      <div className="text-xs text-gray-500 mb-1">
        {item.remainingStock}개 남음
      </div>
      {/* 가격 */}
      <div className="font-bold text-blue-600">
        {(item.salesPrice ?? 0).toLocaleString()}원
      </div>
    </button>
  );
};

export default OrderItem;

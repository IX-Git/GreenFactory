import React, { useState, useMemo } from 'react';

export interface OrderHistoryItemData {
  id: string;
  title: string;
  price: number;
  paymentMethod: string;
  date: string;
  time: string;
  status: string;
  totalItems: number;
}

export interface OrderHistoryProps {
  orders: OrderHistoryItemData[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
}

interface OrderHistoryItemProps extends OrderHistoryItemData {
  selected: boolean;
  onSelect: () => void;
}

const OrderHistoryItem: React.FC<OrderHistoryItemProps> = ({
  id,
  title,
  price,
  paymentMethod,
  date,
  time,
  status,
  totalItems,
  selected,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`
        p-4 border-b border-gray-100 flex justify-between items-center cursor-pointer
        ${status === '주문취소' ? 'bg-red-50' : selected ? 'bg-blue-50' : 'hover:bg-blue-50'}
      `}
    >
      <div className="flex flex-col">
        <div className="font-medium">{title} <span className="text-gray-500">총 {totalItems}건</span></div>
        <div className="text-sm text-gray-500">{paymentMethod}</div>
        <div className="text-sm text-gray-500">{date} {time}</div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-bold">{price.toLocaleString()}원</div>
        <div className={`text-sm ${status === '주문취소' ? 'text-red-500' : 'text-blue-500'}`}>
          {status}
        </div>
      </div>
    </div>
  );
};


const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  selectedOrderId,
  onSelectOrder,
  filterDate,
  setFilterDate,
}) => {
  const [searchText, setSearchText] = useState('');

  // 날짜 필터는 App에서 이미 적용되어 있으므로, 여기서는 검색만 추가 필터
  const filteredOrders = useMemo(() => {
    return orders.filter(o =>
      o.title.includes(searchText) ||
      o.paymentMethod.includes(searchText)
    );
  }, [orders, searchText]);

  return (
    <div className="h-full flex flex-col">
      {/* 검색 */}
      <div className="p-4">
        <input
          type="text"
          placeholder="금액/상품명/결제수단 검색"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md"
        />
      </div>

      {/* 날짜 필터 (App에서 내려온 상태 사용) */}
      <div className="border-t border-gray-200 p-4">
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="w-full p-3 border-b border-gray-200 text-gray-600"
        />
      </div>

      {/* 리스트 */}
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.map(o => (
          <OrderHistoryItem
            key={o.id} 
            {...o}
            selected={o.id === selectedOrderId}
            onSelect={() => onSelectOrder(o.id)}
          />
        ))}
        {filteredOrders.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            보여줄 주문 내역이 없습니다
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
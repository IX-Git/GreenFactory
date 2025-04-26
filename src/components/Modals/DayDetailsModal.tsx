import React from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X } from 'lucide-react';
import { Order } from '../../types';

interface DayDetailsModalProps {
  selectedDate: Date;
  completedOrders: Order[];
  onClose: () => void;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  selectedDate,
  completedOrders,
  onClose
}) => {
  // 선택된 날짜의 주문만 필터링
  const dayOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate.toDateString() === selectedDate.toDateString();
  });

  // 매출 계산
  const daySales = dayOrders
    .filter(order => !order.isExpense)
    .reduce((sum, order) => sum + order.finalAmount, 0);

  // 지출 계산
  const dayExpenses = dayOrders
    .filter(order => order.isExpense)
    .reduce((sum, order) => sum - order.finalAmount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">
            {format(selectedDate, 'PPP', { locale: ko })} 매출 상세
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-500">매출</div>
              <div className="text-xl font-bold text-blue-600">
                {daySales.toLocaleString()}원
              </div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-sm text-gray-500">지출</div>
              <div className="text-xl font-bold text-red-600">
                {dayExpenses.toLocaleString()}원
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {dayOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              해당 날짜의 주문 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {dayOrders.map(order => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">
                      {format(new Date(order.timestamp), 'HH:mm')}
                    </div>
                    <div className={`px-2 py-1 rounded text-sm ${
                      order.isExpense 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {order.paymentMethod}
                    </div>
                  </div>
                  
                  <div className="text-lg font-bold mb-2">
                    {order.isExpense ? '-' : ''}{Math.abs(order.finalAmount).toLocaleString()}원
                  </div>
                  
                  {order.items.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <div className="text-sm font-medium mb-1">주문 상품</div>
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div>{item.name} x {item.quantity}</div>
                            <div>{(item.price * item.quantity).toLocaleString()}원</div>
                          </div>
                        ))}
                      </div>
                      
                      {order.discount > 0 && (
                        <div className="flex justify-between text-sm text-red-500 mt-1">
                          <div>할인</div>
                          <div>-{order.discount.toLocaleString()}원</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

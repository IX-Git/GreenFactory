import React from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { MenuItem, Expense } from '../../types';

interface OrderListProps {
  orderItems: MenuItem[];
  expenses: Expense[];
  discount: number;
  updateQuantity: (id: number, change: number) => void;
  setItemToDelete: (id: number | null) => void;
  setExpenseToDelete: (id: number | null) => void;
  setShowDeleteConfirmation: (show: boolean) => void;
}

const OrderList: React.FC<OrderListProps> = ({
  orderItems,
  expenses,
  discount,
  updateQuantity,
  setItemToDelete,
  setExpenseToDelete,
  setShowDeleteConfirmation
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {orderItems.length === 0 ? (
        expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="flex justify-between items-center p-3 border rounded-md">
                <div className="flex-1">
                  <div className="font-medium">{expense.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-red-500 font-medium">
                    (-) {expense.amount.toLocaleString()}원
                  </div>
                  <button
                    onClick={() => {
                      setExpenseToDelete(expense.id);
                      setShowDeleteConfirmation(true);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            주문서가 비어있습니다
          </div>
        )
      ) : (
        <div className="space-y-3">
          {orderItems.map(item => (
            <div key={item.id} className="flex items-center p-3 border rounded-md">
              <div className="flex items-center space-x-2 mr-3">
                <button
                  onClick={() => updateQuantity(item.id, -1)}
                  className="p-1 bg-gray-200 rounded-full"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">
                  {item.quantity || 1}
                </span>
                <button
                  onClick={() => updateQuantity(item.id, 1)}
                  className="p-1 bg-gray-200 rounded-full"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex-1">
                <div className="font-medium">{item.name}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="font-medium">
                  {(((item.salesPrice ?? 0)) * (item.quantity || 1)).toLocaleString()}원
                </div>
                <button
                  onClick={() => {
                    setItemToDelete(item.id);
                    setShowDeleteConfirmation(true);
                  }}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;

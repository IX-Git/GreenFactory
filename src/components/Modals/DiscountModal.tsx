import React from 'react';
import { X } from 'lucide-react';

interface DiscountModalProps {
  discountAmount: string;
  setDiscountAmount: (value: string | ((prev: string) => string)) => void;
  onApply: () => void;
  onCancel: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  discountAmount,
  setDiscountAmount,
  onApply,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">할인 금액을 입력해 주세요</h3>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center border border-gray-300 rounded-lg p-2 mb-4">
            <span className="text-lg font-medium mr-2">₩</span>
            <input
              type="text"
              value={discountAmount}
              readOnly
              className="flex-1 text-right text-2xl font-bold outline-none"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
              <button
                key={num}
                onClick={() => setDiscountAmount((prev: string) => prev + num.toString())}
                className="p-4 bg-gray-100 rounded-lg text-xl font-medium hover:bg-gray-200"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setDiscountAmount('')}
              className="p-4 bg-gray-100 rounded-lg text-xl font-medium hover:bg-gray-200"
            >
              C
            </button>
            <button
              onClick={() => setDiscountAmount((prev: string) => prev.slice(0, -1))}
              className="p-4 bg-gray-100 rounded-lg text-xl font-medium hover:bg-gray-200"
            >
              ←
            </button>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            취소
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              discountAmount && parseInt(discountAmount) > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onApply}
            disabled={!discountAmount || parseInt(discountAmount) <= 0}
          >
            할인 적용
          </button>
        </div>
      </div>
    </div>
  );
};
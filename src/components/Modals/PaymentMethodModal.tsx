// src/components/Modals/PaymentMethodModal.tsx
import React, { useState } from 'react';

interface PaymentMethodModalProps {
  open: boolean;
  currentMethod: string;
  onClose: () => void;
  onChange: (newMethod: string) => void;
}

const PAYMENT_METHODS = ['카드', '현금', '계좌이체', '외상'];

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  open, currentMethod, onClose, onChange
}) => {
  const [selected, setSelected] = useState(currentMethod);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-96 shadow-lg">
        <h2 className="text-lg font-bold mb-6 text-center">결제수단을 변경할까요?</h2>
        <div className="flex space-x-6 justify-center mb-8">
          {PAYMENT_METHODS.map(method => (
            <label key={method} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="payment-method"
                value={method}
                checked={selected === method}
                onChange={() => setSelected(method)}
                className="accent-blue-600"
              />
              <span className="text-base">{method}</span>
            </label>
          ))}
        </div>
        <button
          className="w-full bg-blue-600 text-white py-3 rounded-md font-bold mb-2"
          onClick={() => onChange(selected)}
        >
          결제수단 변경
        </button>
        <button
          className="w-full py-3 rounded-md border text-gray-700"
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodModal;

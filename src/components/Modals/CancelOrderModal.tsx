import React, { useState } from 'react';

interface CancelOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCancel: (reason: string) => void;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  open,
  onClose,
  onCancel,
}) => {
  const [reason, setReason] = useState('오주문');
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-96 shadow-lg">
        <h2 className="text-lg font-bold mb-6 text-center">주문을 취소할까요?</h2>
        <div className="flex space-x-6 justify-center mb-8">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="cancel-reason"
              value="오주문"
              checked={reason === '오주문'}
              onChange={() => setReason('오주문')}
              className="accent-blue-600"
            />
            <span>오주문</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="cancel-reason"
              value="기타"
              checked={reason === '기타'}
              onChange={() => setReason('기타')}
              className="accent-blue-600"
            />
            <span>기타</span>
          </label>
        </div>
        <button
          className="w-full bg-red-500 text-white py-3 rounded-md font-bold mb-2"
          onClick={() => onCancel(reason)}
        >
          주문 취소
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

export default CancelOrderModal;
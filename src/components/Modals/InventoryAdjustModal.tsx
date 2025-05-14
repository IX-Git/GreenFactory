// src/components/InventoryAdjustModal.tsx
import React, { useState } from 'react';

interface InventoryAdjustModalProps {
  open: boolean;
  mode?: 'add' | 'subtract';
  currentStock: number;
  onClose: () => void;
  onSubmit: (params: { mode: 'add' | 'subtract'; amount: number; reason: string }) => void;
}

const DEFAULT_REASONS = ['오기입', '폐기'];

const InventoryAdjustModal: React.FC<InventoryAdjustModalProps> = ({
  open,
  mode = 'subtract',
  currentStock,
  onClose,
  onSubmit,
}) => {
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract'>(mode);
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  if (!open) return null;

  const handleKeypad = (num: string) => {
    if (num === 'back') {
      setAmount((prev) => prev.slice(0, -1));
    } else {
      if (amount.length < 4) setAmount((prev) => (prev === '0' ? num : prev + num));
    }
  };

  const handleReasonClick = (r: string) => {
    setReason(r);
    setShowCustomInput(false);
    setCustomReason('');
  };

  const handleCustomReason = () => {
    setShowCustomInput(true);
    setReason('');
  };

  const handleSubmit = () => {
    const finalReason = showCustomInput ? customReason : reason;
    if (!amount || !finalReason) return;
    onSubmit({
      mode: adjustMode,
      amount: Number(amount),
      reason: finalReason,
    });
    setAmount('');
    setReason('');
    setCustomReason('');
    setShowCustomInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-8 relative">
        {/* 닫기 버튼 */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-6">수량 조정하기</h2>

        {/* 수량 더하기/빼기 */}
        <div className="flex items-center gap-6 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={adjustMode === 'add'}
              onChange={() => setAdjustMode('add')}
              className="mr-2"
            />
            수량 더하기
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              checked={adjustMode === 'subtract'}
              onChange={() => setAdjustMode('subtract')}
              className="mr-2"
            />
            수량 빼기
          </label>
        </div>

        {/* 수량 입력 */}
        <div className="mb-2">
          <input
            className="w-32 border rounded px-3 py-2 text-lg text-right"
            value={amount}
            readOnly
            placeholder="0개"
          />
          <span className="ml-2 text-gray-500">개</span>
        </div>
        <div className="mb-4 text-gray-500 text-sm">현재 수량 : {currentStock}</div>

        {/* 사유 선택 */}
        <div className="mb-2 text-gray-700">수량 {adjustMode === 'subtract' ? '빼기' : '더하기'} 사유를 선택하세요</div>
        <div className="flex gap-2 mb-4">
          {DEFAULT_REASONS.map((r) => (
            <button
              key={r}
              className={`px-4 py-2 rounded border ${reason === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => handleReasonClick(r)}
              type="button"
            >
              {r}
            </button>
          ))}
          <button
            className={`px-4 py-2 rounded border ${showCustomInput ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={handleCustomReason}
            type="button"
          >
            + 직접등록
          </button>
        </div>
        {showCustomInput && (
          <input
            className="w-full border rounded px-3 py-2 mb-4"
            placeholder="사유를 입력하세요"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
          />
        )}

        {/* 키패드 */}
        <div className="grid grid-cols-3 gap-2 mb-6 max-w-xs mx-auto">
          {[1,2,3,4,5,6,7,8,9,0].map((n, i) => (
            <button
              key={n}
              className="py-3 bg-gray-50 rounded text-lg hover:bg-gray-100"
              onClick={() => handleKeypad(n.toString())}
              type="button"
              style={i === 9 ? { gridColumn: '1 / 2' } : undefined}
            >
              {n}
            </button>
          ))}
          <div></div>
          <button
            className="py-3 bg-gray-50 rounded text-lg hover:bg-gray-100 col-span-1"
            onClick={() => handleKeypad('back')}
            type="button"
          >
            ←
          </button>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-between mt-8">
          <button
            className="px-8 py-2 bg-gray-100 text-gray-700 rounded font-semibold"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="px-8 py-2 bg-blue-600 text-white rounded font-semibold"
            onClick={handleSubmit}
            disabled={!amount || !(showCustomInput ? customReason : reason)}
          >
            {adjustMode === 'subtract' ? '수량 빼기' : '수량 더하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryAdjustModal;

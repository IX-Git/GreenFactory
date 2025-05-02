import React, { useState, useEffect } from 'react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import InventoryTable from './InventoryTable';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { InventoryRecord } from '../../types/inventory';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const InventoryManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState<string>('입출고');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [dateRange, setDateRange] = useState('2025-05-01(목) ~ 2025-05-08(목)');
  const [sortType, setSortType] = useState<'latest' | 'low' | 'high'>('latest');

  // 상품 데이터 불러오기
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let productData: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Product, 'id'>
      }));
      // 정렬
      if (sortType === 'low') {
        productData = [...productData].sort((a, b) => a.stock - b.stock);
      } else if (sortType === 'high') {
        productData = [...productData].sort((a, b) => b.stock - a.stock);
      }
      setProducts(productData);
      if (productData.length > 0 && !selectedProduct) {
        setSelectedProduct(productData[0]);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [sortType]);

  // 선택된 상품의 재고 기록 불러오기
  useEffect(() => {
    if (!selectedProduct) return;
    let q = query(
      collection(db, 'inventory'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryData: InventoryRecord[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<InventoryRecord, 'id'>
        }))
        .filter(record => {
          if (filterType !== '입출고') {
            return record.type === filterType;
          }
          return true;
        })
        .filter(record => record.productId === selectedProduct.id);
      setRecords(inventoryData);
    });
    return () => unsubscribe();
  }, [selectedProduct, filterType]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
  };

  const handleAdjustStock = async (params: { mode: 'add' | 'subtract', amount: number, reason: string }) => {
    if (!selectedProduct) return;
    const { mode, amount, reason } = params;
    const adjustment = mode === 'add' ? amount : -amount;
    const newStock = selectedProduct.stock + adjustment;
    try {
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        stock: newStock
      });
      await addDoc(collection(db, 'inventory'), {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        type: mode === 'add' ? '입고' : '출고',
        reason: reason,
        adjustment: adjustment,
        afterStock: newStock,
        timestamp: Timestamp.now()
      });
      setShowAdjustModal(false);
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  return (
    <div className="flex h-full">
      {/* 중간: 상품 목록/정렬 */}
      <section className="w-80 border-r bg-white flex flex-col">
        <div className="px-6 py-4 border-b">
          <div className="text-xs text-gray-400 mb-1">상품 관리 / 재고관리</div>
          <h1 className="text-xl font-bold mb-4">재고관리</h1>
          <div className="flex flex-nowrap whitespace-nowrap space-x-1 mb-4 text-base">
            <button
              className={`px-3 py-1 rounded-md font-medium border ${sortType === 'latest' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setSortType('latest')}
            >최신순</button>
            <button
              className={`px-3 py-1 rounded-md font-medium border ${sortType === 'low' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setSortType('low')}
            >재고 적은순</button>
            <button
              className={`px-3 py-1 rounded-md font-medium border ${sortType === 'high' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setSortType('high')}
            >재고 많은순</button>
          </div>
          <div>
            {products.map(product => (
              <div
                key={product.id}
                className={`flex justify-between items-center px-4 py-3 rounded cursor-pointer mb-2 ${selectedProduct?.id === product.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                onClick={() => handleProductSelect(product)}
              >
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.category} | {product.price.toLocaleString()}원</div>
                </div>
                <div className="font-bold">{product.stock}개</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 우측: 상세/테이블/필터/수량조정 */}
      <main className="flex-1 bg-white">
        <div className="flex items-center gap-2 px-6 py-4 border-b">
          <div className="font-bold text-lg">{selectedProduct?.name}</div>
          <div className="text-gray-500 ml-2">재고: {selectedProduct?.stock ?? 0}개</div>
          <div className="flex-1" />
          <div className="flex items-center border rounded px-3 py-2 bg-white text-gray-700 text-sm">
            {dateRange}
            <Filter size={18} className="ml-2 text-gray-500" />
          </div>
          <select
            className="border rounded px-4 py-2 bg-white text-gray-700 ml-2 text-sm"
            value={filterType}
            onChange={handleFilterChange}
          >
            <option>입출고</option>
            <option>입고</option>
            <option>출고</option>
            <option>초기화</option>
          </select>
          <button
            className="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            onClick={() => setShowAdjustModal(true)}
          >
            수량 조정하기
          </button>
        </div>
        <div className="px-6 py-4">
          <InventoryTable records={records} />
          <div className="flex justify-center mt-4">
            {[1, 2, 3, 4, 5].map(page => (
              <button
                key={page}
                className={`w-8 h-8 mx-1 rounded ${currentPage === page ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
        {/* 수량 조정 모달 */}
        {showAdjustModal && selectedProduct && (
          <InventoryAdjustModal
            open={showAdjustModal}
            currentStock={selectedProduct.stock}
            onClose={() => setShowAdjustModal(false)}
            onSubmit={handleAdjustStock}
          />
        )}
      </main>
    </div>
  );
};

// 수량 조정 모달 컴포넌트는 이전과 동일하게 포함

interface InventoryAdjustModalProps {
  open: boolean;
  currentStock: number;
  onClose: () => void;
  onSubmit: (params: { mode: 'add' | 'subtract'; amount: number; reason: string }) => void;
}

const InventoryAdjustModal: React.FC<InventoryAdjustModalProps> = ({
  open,
  currentStock,
  onClose,
  onSubmit,
}) => {
  const [adjustMode, setAdjustMode] = useState<'add' | 'subtract'>('subtract');
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
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          aria-label="닫기"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-6">수량 조정하기</h2>
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
        <div className="mb-2">
          <input
            className="w-32 border rounded px-3 py-2 text-lg text-right"
            value={amount ? `${amount}개` : '0개'}
            readOnly
          />
        </div>
        <div className="mb-4 text-gray-500 text-sm">현재 수량 : {currentStock}</div>
        <div className="mb-2 text-gray-700">수량 {adjustMode === 'subtract' ? '빼기' : '더하기'} 사유를 선택하세요</div>
        <div className="flex gap-2 mb-4">
          <button
            className={`px-4 py-2 rounded border ${reason === '오기입' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => handleReasonClick('오기입')}
            type="button"
          >
            오기입
          </button>
          <button
            className={`px-4 py-2 rounded border ${reason === '폐기' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
            onClick={() => handleReasonClick('폐기')}
            type="button"
          >
            폐기
          </button>
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
        <div className="grid grid-cols-3 gap-2 mb-6">
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

export default InventoryManagement;

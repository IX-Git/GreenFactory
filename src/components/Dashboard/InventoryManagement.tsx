import React, { useState, useEffect } from 'react';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import InventoryTable from './InventoryTable';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, Timestamp, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { MenuItem } from '../../types';
import { useProducts } from '../../hooks/useProducts';

// InventoryRecord 타입 정의
interface InventoryRecord {
  id: string;
  productId: string;
  productName: string;
  type: string;
  reason: string;
  adjustment: number;
  afterStock: number;
  timestamp: string;
  orderId?: string;
}

const InventoryManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [filterType, setFilterType] = useState<string>('입출고');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [dateRange, setDateRange] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  const [sortType, setSortType] = useState<'latest' | 'low' | 'high'>('latest');
  
  // 날짜 포맷 함수
  const formatDateRange = (start: Date, end: Date) => {
    const formatDate = (date: Date) => {
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dayOfWeek = days[date.getDay()];
      return `${date.getFullYear()}-${month}-${day}(${dayOfWeek})`;
    };
    return `${formatDate(start)} ~ ${formatDate(end)}`;
  };
  
  // 컴포넌트 마운트 시 날짜 범위 초기화
  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    setCurrentDateRange({ start: today, end: nextWeek });
    setDateRange(formatDateRange(today, nextWeek));
  }, []);
  
  // 날짜 범위 변경 함수
  const handleDateRangeChange = (newRange: { start: Date; end: Date }) => {
    setCurrentDateRange(newRange);
    setDateRange(formatDateRange(newRange.start, newRange.end));
    setShowDatePicker(false);
  };

  const moveWeek = (direction: 'next' | 'prev') => {
    const { start, end } = currentDateRange;
    const days = 7 * 24 * 60 * 60 * 1000;
    
    if (direction === 'next') {
      const newStart = new Date(start.getTime() + days);
      const newEnd = new Date(end.getTime() + days);
      setCurrentDateRange({ start: newStart, end: newEnd });
      setDateRange(formatDateRange(newStart, newEnd));
    } else {
      const newStart = new Date(start.getTime() - days);
      const newEnd = new Date(end.getTime() - days);
      setCurrentDateRange({ start: newStart, end: newEnd });
      setDateRange(formatDateRange(newStart, newEnd));
    }
  };
  
  // useProducts 훅 사용
  const { menuItems, getSortedProducts } = useProducts();
  
  // 정렬된 상품 목록 계산
  const sortedProducts = React.useMemo(() => {
    // getSortedProducts 함수 사용
    return getSortedProducts(sortType);
  }, [menuItems, sortType, getSortedProducts]);
  
  // 초기 선택 상품 설정
  useEffect(() => {
    if (sortedProducts.length > 0 && !selectedProduct) {
      const savedProductId = localStorage.getItem('selectedProductId');
      if (savedProductId) {
        const product = sortedProducts.find(p => p.docId === savedProductId);
        if (product) {
          setSelectedProduct(product);
          return;
        }
      }
      setSelectedProduct(sortedProducts[0]);
    }
  }, [sortedProducts, selectedProduct]);
  

  // 선택된 상품의 재고 기록 불러오기
useEffect(() => {
  if (!selectedProduct?.docId) {
    console.log('선택된 상품이 없거나 docId가 없습니다');
    return;
  }
  
  console.log('선택된 상품:', selectedProduct);
  
  // 시작 날짜와 종료 날짜 설정
  const startDate = new Date(currentDateRange.start);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(currentDateRange.end);
  endDate.setHours(23, 59, 59, 999);
  
  // Firestore 타임스탬프로 변환
  const startTimestamp = Timestamp.fromDate(startDate);
  const endTimestamp = Timestamp.fromDate(endDate);
  
  try {
    // 단순화된 쿼리로 변경하여 디버깅
    const q = query(
      collection(db, 'inventory'),
      where('productId', '==', selectedProduct.docId),
      orderBy('timestamp', 'desc')
    );
    
    console.log('쿼리 생성됨:', q);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot received:', snapshot.docs.length);
      const inventoryData: InventoryRecord[] = snapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('문서 데이터:', data);
          
          // Firestore 타임스탬프를 문자열로 변환
          const timestamp = data.timestamp && typeof data.timestamp.toDate === 'function' 
            ? data.timestamp.toDate().toLocaleString() 
            : new Date().toLocaleString();
          
          return {
            id: doc.id,
            productId: data.productId,
            productName: data.productName || selectedProduct.name,
            type: data.type,
            reason: data.reason,
            adjustment: data.adjustment,
            afterStock: data.afterStock,
            timestamp: timestamp,
            orderId: data.orderId
          };
        })
        // 클라이언트 측에서 필터링 수행
        .filter(record => {
          // 날짜 필터링
          if (record.timestamp) {
            const recordDate = new Date(record.timestamp);
            if (recordDate < startDate || recordDate > endDate) {
              return false;
            }
          }
          
          // 타입 필터링
          if (filterType !== '입출고' && record.type !== filterType) {
            return false;
          }
          
          return true;
        });
      
      console.log('필터링된 데이터:', inventoryData);
      setRecords(inventoryData);
    }, (error) => {
      console.error('재고 기록 조회 중 오류:', error);
      setRecords([]);
    });
    
    return () => unsubscribe();
  } catch (error) {
    console.error('쿼리 생성 중 오류:', error);
    setRecords([]);
  }
}, [selectedProduct, filterType, currentDateRange]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleProductSelect = (product: MenuItem) => {
    setSelectedProduct(product);
  if (product?.docId) {
    localStorage.setItem('selectedProductId', product.docId);
  }
};

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(e.target.value);
  };

  const handleAdjustStock = async (params: { mode: 'add' | 'subtract', amount: number, reason: string }) => {
    if (!selectedProduct || !selectedProduct.docId) {
      console.error('선택된 상품이 없거나 docId가 없습니다');
      return;
    }
    
    const { mode, amount, reason } = params;
    const adjustment = mode === 'add' ? amount : -amount;
    const newStock = Math.max(0, (selectedProduct.remainingStock || 0) + adjustment);
    
    try {
      console.log('재고 조정 시작:', selectedProduct.docId, newStock);
      
      // 메뉴 아이템 업데이트
      await updateDoc(doc(db, 'menuItems', selectedProduct.docId), {
        remainingStock: newStock
      });
      
      // 인벤토리 기록 추가
      const inventoryRef = await addDoc(collection(db, 'inventory'), {
        productId: selectedProduct.docId,
        productName: selectedProduct.name,
        type: mode === 'add' ? '입고' : '출고',
        reason: reason,
        adjustment: adjustment,
        afterStock: newStock,
        timestamp: Timestamp.now()
      });
      
      console.log('인벤토리 기록 추가됨:', inventoryRef.id);
      setShowAdjustModal(false);
    } catch (error) {
      console.error('재고 조정 오류:', error);
    }
  };
  
  return (
    <div className="flex h-full bg-white">
      {/* 중간: 상품 목록/정렬 */}
      <section className="w-80 border-r bg-white flex flex-col overflow-y-auto">
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
            {sortedProducts.map(product => (
              <div
                key={product.id}
                className={`flex justify-between items-center px-4 py-3 rounded cursor-pointer mb-2 ${selectedProduct?.id === product.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                onClick={() => handleProductSelect(product)}
              >
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    {product.category} | {(product.salesPrice || 0).toLocaleString()}원
                  </div>
                </div>
                <div className="font-bold">{product.remainingStock || 0}개</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 우측: 상세/테이블/필터/수량조정 */}
      <main className="flex-1 bg-white overflow-auto">
        <div className="flex items-center gap-2 px-6 py-4 border-b bg-white">
          <div className="font-bold text-lg">{selectedProduct?.name}</div>
          <div className="text-gray-500 ml-2">재고: {selectedProduct?.remainingStock ?? 0}개</div>
          <div className="flex-1" />
          <div className="flex items-center border rounded px-3 py-2 bg-white text-gray-700 text-sm cursor-pointer relative">
            <button 
              className="p-1 hover:bg-gray-100 rounded-full mr-1"
              onClick={() => moveWeek('prev')}
            >
              <ChevronLeft size={16} />
            </button>
            <div onClick={() => setShowDatePicker(true)}>
              {dateRange}
            </div>
            <button 
              className="p-1 hover:bg-gray-100 rounded-full ml-1"
              onClick={() => moveWeek('next')}
            >
              <ChevronRight size={16} />
            </button>
            <Filter size={18} className="ml-2 text-gray-500" />
            
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md z-10 p-4">
                {/* 여기에 날짜 선택 컴포넌트 추가 */}
                <div className="flex justify-end mt-2">
                  <button 
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    onClick={() => setShowDatePicker(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
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
        <div className="px-6 py-4 bg-white">
          <InventoryTable records={records} />
          <div className="flex justify-center mt-4 bg-white">
            {[1, 2, 3, 4, 5].map(page => (
              <button
                key={page}
                className={`w-8 h-8 mx-1 rounded ${currentPage === page ? 'bg-blue-100 text-blue-600 border border-blue-300' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => handlePageChange(page)}
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
            currentStock={selectedProduct.remainingStock || 0}
            onClose={() => setShowAdjustModal(false)}
            onSubmit={handleAdjustStock}
          />
        )}
      </main>
    </div>
  );
};

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

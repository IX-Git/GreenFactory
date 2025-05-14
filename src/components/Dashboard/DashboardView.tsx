// src/components/Dashboard/DashboardView.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import CategoryManagement from './CategoryManagement';
import ProductManagement from './ProductManagement';
import SalesOverview from './SalesOverview';
import SalesCalendar from './SalesCalendar';
import SalesDetailModal from '../Modals/SalesDetailModal';
import InventoryManagement from './InventoryManagement'; 
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { AppUser, SalesFilter } from '../../types';

interface Order {
  id: string;
  items: any[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMethod: string;
  timestamp: Date;
  isExpense?: boolean;
  purchaseTotal?: number;
}

interface DashboardViewProps {
  appUser: AppUser;
  currentTime: Date;
  showToastMessage: (msg: string) => void;
  onShowSalesDetail: () => void;
  onChangeDate: React.Dispatch<React.SetStateAction<Date>>;
}

const DashboardView: React.FC<DashboardViewProps> = ({
  appUser,
  currentTime,
  showToastMessage,
  onShowSalesDetail,
  onChangeDate,
}) => {
  const [dashboardTab, setDashboardTab] = useState<'매출현황' | '매출달력' | '상품' | '카테고리' | '재고관리'>('매출현황');
  const [salesFilter, setSalesFilter] = useState<SalesFilter>('오늘');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'year'>('day');
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Firestore 주문 구독
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setCompletedOrders(
        snap.docs.map(d => {
          const data = d.data() as any;
          return {
            id: d.id,
            items: data.items || [],
            totalAmount: data.totalAmount,
            discount: data.discount,
            finalAmount: data.finalAmount,
            paymentMethod: data.paymentMethod,
            timestamp: data.timestamp.toDate(),
            isExpense: data.isExpense,
            purchaseTotal: data.purchaseTotal,
          } as Order;
        })
      );
    });
    return () => unsub();
  }, []);

  // 필터 변경
  const handleFilterChange = (filter: SalesFilter) => {
    setSalesFilter(filter);
    const now = new Date();
    switch (filter) {
      case '오늘':
        setSelectedDate(now);
        break;
      case '어제': {
        const y = new Date(now);
        y.setDate(now.getDate() - 1);
        setSelectedDate(y);
        break;
      }
      case '이번 주': {
        const day = now.getDay();
        const mon = new Date(now);
        mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        setSelectedDate(mon);
        break;
      }
      case '이번 달':
        setSelectedDate(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      case '직접 선택':
        break;
    }
    setViewMode('day');
  };

  // 날짜 직접 선택
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setSalesFilter('직접 선택');
  };

  // Month/Year
  const handleMonthButtonClick = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setViewMode('day');
    setSalesFilter('이번 달');
  };
  const handleYearButtonClick = () => setViewMode('year');
  const handleMonthSelect = (year: number, month: number) => {
    setSelectedDate(new Date(year, month - 1, 1));
    setViewMode('day');
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* 사이드바 */}
      <aside className="w-64 bg-white border-r overflow-y-auto">
        <div className="p-4">
          <div className="font-medium mb-2">현황</div>
          <ul className="space-y-2">
            <li
              className={`cursor-pointer ${dashboardTab === '매출현황' ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={() => setDashboardTab('매출현황')}
            >
              매출현황
            </li>
            <li
              className={`cursor-pointer ${dashboardTab === '매출달력' ? 'text-blue-600' : 'text-gray-600'}`}
              onClick={() => setDashboardTab('매출달력')}
            >
              매출달력
            </li>
            <li>
              <div className="font-medium">상품 관리</div>
              <ul className="ml-4 mt-2 space-y-2">
                <li
                  className={`cursor-pointer ${dashboardTab === '상품' ? 'text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setDashboardTab('상품')}
                >
                  상품
                </li>
                <li
                  className={`cursor-pointer ${dashboardTab === '카테고리' ? 'text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setDashboardTab('카테고리')}
                >
                  카테고리
                </li>
                <li
                  className={`cursor-pointer ${dashboardTab === '재고관리' ? 'text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setDashboardTab('재고관리')}
                >
                  재고관리
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className={`flex-1 p-6 overflow-y-auto h-full ${dashboardTab === '매출달력' ? 'calendar-container' : ''}`}>
        {/* 매출현황 */}
        {dashboardTab === '매출현황' && <SalesOverview showToastMessage={showToastMessage} />}

        {/* 매출달력 */}
        {dashboardTab === '매출달력' && (
          <>
            <SalesCalendar
              salesFilter={salesFilter}
              selectedDate={selectedDate}
              viewMode={viewMode}
              handleFilterChange={handleFilterChange}
              handleDateChange={handleDateChange}
              handleMonthButtonClick={handleMonthButtonClick}
              handleYearButtonClick={handleYearButtonClick}
              handleMonthSelect={handleMonthSelect}
              completedOrders={completedOrders}
              setSelectedDate={setSelectedDate}
              setSalesFilter={setSalesFilter}
              openSalesDetailModal={(date: Date) => {
                setSelectedDate(date);
                setSalesFilter('직접 선택');
                setShowCalendarModal(true);
              }}
            />
            {showCalendarModal && (
              <SalesDetailModal
                date={selectedDate}
                orders={completedOrders}
                onClose={() => setShowCalendarModal(false)}
                onPrevDay={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  handleDateChange(prev);
                }}
                onNextDay={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  handleDateChange(next);
                }}
              />
            )}
          </>
        )}

        {/* 상품 관리 */}
        {dashboardTab === '상품' && <ProductManagement showToastMessage={showToastMessage} />}

        {/* 카테고리 관리 */}
        {dashboardTab === '카테고리' && <CategoryManagement showToastMessage={showToastMessage} />}

        {/* 재고 관리 */}
        {dashboardTab === '재고관리' && <InventoryManagement />}
      </main>
    </div>
  );
};

export default DashboardView;

import React, { useState } from 'react';
import { useSales } from '../../hooks/useSales';
import { useOrders } from '../../hooks/useOrders';
import { useProducts } from '../../hooks/useProducts';
import SalesDetailModal from '../Modals/SalesDetailModal';

interface SalesOverviewProps {
  showToastMessage: (message: string) => void;
}

const SalesOverview: React.FC<SalesOverviewProps> = ({ showToastMessage }) => {
  const { menuItems } = useProducts();
  const { completedOrders } = useOrders(menuItems, showToastMessage);
  const { 
    salesFilter,
    selectedDate,
    tooltip,
    filteredOrders,
    dashboardSales,
    dashboardPurchases,
    dashboardOtherExpenses,
    dashboardProfit,
    hourlySalesData,
    handleFilterChange,
    handleDateChange,
    getProductRankings,
    calculateInventoryRate,
    handleBarClick,
  } = useSales(completedOrders);
  
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">매출현황</h2>
        <div className="flex space-x-2">
          {/* 필터 UI: 어제/오늘/이번 주/이번 달 버튼 + 날짜 선택 */}
          {(['어제', '오늘', '이번 주', '이번 달'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-2 rounded-md ${
                salesFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {filter}
            </button>
          ))}
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => {
              const newDate = e.target.value ? new Date(e.target.value) : new Date();
              handleDateChange(newDate);
            }}
            className="px-4 py-2 border border-gray-200 rounded-md text-gray-600"
          />
        </div>
      </div>

      {/* 카드 영역 (매출, 재고 소진율, 주문건) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">매출</h3>
          {completedOrders.length > 0 ? (
            <p className={`text-2xl font-bold ${dashboardSales >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              {dashboardSales.toLocaleString()}원
            </p>
          ) : (
            <p className="text-gray-400">데이터가 없습니다</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">재고 소진율</h3>
          {completedOrders.length > 0 ? (
            <p className="text-2xl font-bold text-blue-600">
              {calculateInventoryRate()}%
            </p>
          ) : (
            <p className="text-gray-400">데이터가 없습니다</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">주문건</h3>
          {completedOrders.length > 0 ? (
            <p className="text-2xl font-bold text-blue-600">
              {filteredOrders.filter(order => !order.isExpense).length}건
            </p>
          ) : (
            <p className="text-gray-400">데이터가 없습니다</p>
          )}
        </div>
      </div>

      {/* 시간대별 매출현황 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">시간대별 매출현황</h3>
        {hourlySalesData.some(data => data.amount > 0) ? (
          <div className="relative h-80">
            {/* Y축 눈금 */}
            <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="text-xs text-gray-500">
                  {((5 - i) * 200000).toLocaleString()}원
                </div>
              ))}
            </div>
            
            {/* 그래프 영역 */}
            <div className="ml-16 h-full flex items-end space-x-2">
              {hourlySalesData.map((data, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-full ${data.amount >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{
                      height: data.amount > 0
                        ? `${Math.max(Math.min(data.amount, 1000000) / (1000000 / 300), 4)}px`
                        : '0px'
                    }}
                    onClick={(e) => handleBarClick(e, data)}
                  ></div>
                  <div className="text-xs mt-1">{data.hour}시</div>
                </div>
              ))}
            </div>
            
            {/* 툴팁 */}
            {tooltip.visible && (
              <div
                className="absolute bg-gray-800 text-white px-2 py-1 rounded text-xs"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y}px`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                {tooltip.amount.toLocaleString()}원
              </div>
            )}
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-400">
            데이터가 없습니다
          </div>
        )}
      </div>

      {/* 상품 주문건수 순위 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">상품 주문건수 순위</h3>
          <button
            onClick={() => setShowSalesDetailModal(true)}
            className="text-blue-500 hover:text-blue-700"
          >
            상세보기
          </button>
        </div>
        {getProductRankings().length > 0 ? (
          <div className="space-y-2">
            {getProductRankings().slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium mr-3">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">{product.count}건</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            데이터가 없습니다
          </div>
        )}
      </div>

      {/* 매출 상세 모달 */}
      {showSalesDetailModal && (
        <SalesDetailModal
            date={selectedDate}
            orders={filteredOrders}
            onClose={() => setShowSalesDetailModal(false)}
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
      </div>
    );
  };

export default SalesOverview;

// src/components/Dashboard/SalesCalendar.tsx
import React from 'react';
import { format } from 'date-fns';
import { SalesFilter } from '../../types';

interface SalesCalendarProps {
  salesFilter: SalesFilter;
  selectedDate: Date;
  viewMode: 'day' | 'year';
  handleFilterChange: (filter: SalesFilter) => void;
  handleDateChange: (date: Date) => void;
  handleMonthButtonClick: () => void;
  handleYearButtonClick: () => void;
  handleMonthSelect: (year: number, month: number) => void;
  completedOrders: any[]; 
  setSelectedDate: (date: Date) => void;
  setSalesFilter: (filter: SalesFilter) => void;
  openSalesDetailModal: (date: Date) => void;
}

const SalesCalendar: React.FC<SalesCalendarProps> = ({
  salesFilter,
  selectedDate,
  viewMode,
  handleFilterChange,
  handleDateChange,
  handleMonthButtonClick,
  handleYearButtonClick,
  handleMonthSelect,
  completedOrders,
  setSelectedDate,
  setSalesFilter,
  openSalesDetailModal,
}) => (
  <div className="calendar-container flex-1 p-6">
    {/* 상단 필터 영역 */}
    <div className="mb-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {(['어제','오늘','이번 주','이번 달'] as SalesFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-2 rounded-md ${
                salesFilter === filter ? 'bg-[#635BFF] text-white' : 'bg-[#313E54] text-white'
              }`}
            >
              {filter}
            </button>
          ))}
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={e => handleDateChange(e.target.value ? new Date(e.target.value) : new Date())}
            className="px-4 py-2 border border-gray-200 rounded-md text-gray-600"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMonthButtonClick}
            className="px-4 py-2 rounded-md bg-[#313E54] text-white"
          >
            Month
          </button>
          <button
            onClick={handleYearButtonClick}
            className="px-4 py-2 rounded-md bg-[#313E54] text-white"
          >
            Year
          </button>
        </div>
      </div>
    </div>

    {/* Year 모드 */}
    {viewMode === 'year' && (
      <div className="p-6">
        <div className="mb-2 flex justify-center items-center text-xl font-bold text-white">
          {selectedDate.getFullYear()}년
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 min-h-[134px]">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const isSelected = selectedDate.getMonth() === m - 1;
            return (
              <button
                key={m}
                onClick={() => handleMonthSelect(selectedDate.getFullYear(), m)}
                className={`py-2 rounded text-sm font-medium ${
                  isSelected ? 'bg-[#635BFF] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {m}월
              </button>
            );
          })}
        </div>
      </div>
    )}

    {/* Day 모드 */}
    {viewMode === 'day' && (
      <div className="bg-white rounded-lg shadow p-6 calendar-wrapper">
        <div className="grid grid-cols-7 gap-4 calendar-header">
          {['일','월','화','수','목','금','토'].map(day => (
            <div key={day} className="calendar-header-cell">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {(() => {
            const today = new Date();
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const lastDayOfMonth = new Date(year, month + 1, 0);
            const firstDayOfWeek = firstDayOfMonth.getDay();
            const daysInMonth = lastDayOfMonth.getDate();
            const daysArray: (Date | null)[] = [];

            for (let i = 0; i < firstDayOfWeek; i++) daysArray.push(null);
            for (let i = 1; i <= daysInMonth; i++) daysArray.push(new Date(year, month, i));

            return daysArray.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="calendar-cell"></div>;
              }
              const isToday = date.toDateString() === today.toDateString();
              const dayOrders = completedOrders.filter(order => {
                const orderDate = new Date(order.timestamp);
                orderDate.setHours(0,0,0,0);
                return orderDate.getTime() === date.getTime();
              });

              if (dayOrders.length === 0) {
                return (
                  <div
                    key={`date-${index}`}
                    className={`calendar-cell cursor-pointer ${isToday ? 'calendar-cell-today' : ''}`}
                    onClick={() => {
                      setSelectedDate(date);
                      setSalesFilter('직접 선택');
                    }}
                  >
                    <div className="calendar-cell-date">{date.getDate()}</div>
                  </div>
                );
              }

              const daySales = dayOrders
                .filter(o => !o.isExpense)
                .reduce((sum, o) => sum + o.finalAmount, 0);
              const dayPurchases = dayOrders
                .filter(o => !o.isExpense)
                .reduce((sum, o) => sum + (o.purchaseTotal ?? 0), 0);
              const dayOtherExpenses = dayOrders
                .filter(o => o.isExpense)
                .reduce((sum, o) => sum - o.finalAmount, 0);
              const dayProfit = daySales - dayPurchases - dayOtherExpenses;
              const isSelected = date.toDateString() === selectedDate.toDateString();

              return (
                <div
                  key={`date-${index}`}
                  className={`calendar-cell cursor-pointer ${isToday ? 'calendar-cell-today' : ''} ${isSelected ? 'bg-[#635BFF] text-white' : ''}`}
                  onClick={() => openSalesDetailModal(date)}
                  style={{ minWidth: 'auto' }}
                >
                  <div className="calendar-cell-date">{date.getDate()}</div>
                  <div className="calendar-cell-sales-container">
                    <div className="calendar-cell-sales-positive">{daySales.toLocaleString()}원</div>
                    <div className="calendar-cell-sales-purple">{dayPurchases.toLocaleString()}원</div>
                    <div className="calendar-cell-sales-negative">{dayOtherExpenses.toLocaleString()}원</div>
                    <div className="calendar-cell-sales-yellow">{dayProfit.toLocaleString()}원</div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>
    )}
  </div>
);

export default SalesCalendar;

// src/components/Modals/SalesDetailModal.tsx
import React, { useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface FinancialEntry {
  label: string;
  amount: number | string;
}

interface DailyFinancialData {
  date: string;
  balance: number | string;
  businessExpense: number | string;
  salesTotal: number | string;
  expenseItems: FinancialEntry[];
  salesItems: FinancialEntry[];
  otherExpenses: FinancialEntry[];
  inventoryRate: number | string;
  orderCount: number | string;
  orderUnitPrice: number | string;
}

interface SalesDetailModalProps {
  date: Date;
  orders: any[];
  onClose: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
}

const SalesDetailModal: React.FC<SalesDetailModalProps> = ({
  date,
  orders = [],
  onClose,
  onPrevDay,
  onNextDay,
}) => {
  // 데이터 집계
  const data: DailyFinancialData = useMemo(() => {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const dayOrders = orders.filter(order => {
      const d = new Date(order.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === target.getTime();
    });

    if (dayOrders.length === 0) {
      return {
        date: format(date, 'yyyy-MM-dd'),
        balance: 'N/A',
        businessExpense: 'N/A',
        salesTotal: 'N/A',
        expenseItems: [],
        salesItems: [],
        otherExpenses: [],
        inventoryRate: 'N/A',
        orderCount: 'N/A',
        orderUnitPrice: 'N/A',
      };
    }

    const salesOrders = dayOrders.filter(o => !o.isExpense);
    const expenseOrders = dayOrders.filter(o => o.isExpense);

    const salesTotal = salesOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
    const businessExpense = salesOrders.reduce((sum, o) => sum + (o.purchaseTotal || 0), 0);
    const expenseSum = expenseOrders.reduce((sum, o) => sum + Math.abs(o.finalAmount || 0), 0);
    const discountSum = salesOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const balance = salesTotal - businessExpense - expenseSum - discountSum;

    const salesItems: FinancialEntry[] = [
      { label: '현금 매출', amount: salesOrders.filter(o => o.paymentMethod === '현금').reduce((s, o) => s + (o.finalAmount || 0), 0) },
      { label: '카드 매출', amount: salesOrders.filter(o => o.paymentMethod === '카드').reduce((s, o) => s + (o.finalAmount || 0), 0) },
      { label: '계좌이체 매출', amount: salesOrders.filter(o => o.paymentMethod === '계좌이체').reduce((s, o) => s + (o.finalAmount || 0), 0) },
      { label: '외상 매출', amount: salesOrders.filter(o => o.paymentMethod === '외상').reduce((s, o) => s + (o.finalAmount || 0), 0) },
    ];

    const otherExpenses: FinancialEntry[] = [
      { label: '기타지출', amount: expenseSum },
      { label: '할인', amount: discountSum },
    ];

    const orderCount = salesOrders.length;
    const orderUnitPrice = orderCount > 0 ? Math.round(salesTotal / orderCount) : 'N/A';

    const inventoryRate = 'N/A'; // 실제 로직 필요 시 수정

    return {
      date: format(date, 'yyyy-MM-dd'),
      balance,
      businessExpense,
      salesTotal,
      expenseItems: [
        { label: '지출 합계', amount: expenseSum },
        { label: '할인 합계', amount: discountSum },
      ],
      salesItems,
      otherExpenses,
      inventoryRate,
      orderCount,
      orderUnitPrice,
    };
  }, [orders, date]);

  const fmt = (value: number | string): string =>
    typeof value === 'number'
      ? value.toLocaleString() + '원'
      : value || 'N/A';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="bg-white rounded-lg w-[800px] h-[730px] flex flex-col shadow-lg"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">매출 상세내역</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-auto">
            <div className="flex items-center justify-center gap-4 mb-8">
              <button className="text-gray-400" onClick={onPrevDay}>
                <ChevronLeft size={20} />
              </button>
              <span className="text-base">{data.date}</span>
              <button className="text-gray-400" onClick={onNextDay}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span>실손익</span>
                  <span>{fmt(data.balance)}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">사업 합계</span>
                    <span>- {fmt(data.businessExpense)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">매출 합계</span>
                    <span>+ {fmt(data.salesTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">지출 합계</span>
                    <span>- {fmt(data.expenseItems[0]?.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">할인 합계</span>
                    <span>- {fmt(data.expenseItems[1]?.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span>매출</span>
                  <span>{fmt(data.salesTotal)}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">주문 건수</span>
                    <span>
                      {typeof data.orderCount === 'number' ? data.orderCount : 'N/A'}건
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">건 단가</span>
                    <span>{fmt(data.orderUnitPrice)}</span>
                  </div>
                  {data.salesItems.map((entry, i) => (
                    <div className="flex justify-between items-center" key={i}>
                      <span className="text-gray-600">{entry.label}</span>
                      <span>{fmt(entry.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                {data.otherExpenses.map((entry, i) => (
                  <div className="flex justify-between items-center" key={i}>
                    <span className="text-gray-600">{entry.label}</span>
                    <span>- {fmt(entry.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span>재고 소진율</span>
                  <span>
                    {typeof data.inventoryRate === 'number'
                      ? data.inventoryRate + '%'
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesDetailModal;

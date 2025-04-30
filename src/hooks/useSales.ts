// src/hooks/useSales.ts
import { useState, useMemo } from 'react';
import { Order, SalesFilter, TooltipState } from '../types';

export const useSales = (completedOrders: Order[]) => {
  const [salesFilter, setSalesFilter] = useState<SalesFilter>('오늘');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'year'>('day');
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    amount: 0,
  });

  // 1) 날짜·필터에 맞는 주문
  const filteredOrders = useMemo(() => {
    const now = new Date(selectedDate);
    now.setHours(0, 0, 0, 0);

    if (['어제','오늘','직접 선택'].includes(salesFilter)) {
      return completedOrders.filter(o => {
        const d = new Date(o.timestamp);
        d.setHours(0,0,0,0);
        return d.getTime() === now.getTime();
      });
    }

    if (salesFilter === '이번 주') {
      const day = now.getDay();
      const start = new Date(now);
      start.setDate(now.getDate() - day);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
      return completedOrders.filter(o => {
        const d = new Date(o.timestamp);
        return d >= start && d <= end;
      });
    }

    if (salesFilter === '이번 달') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
      return completedOrders.filter(o => {
        const d = new Date(o.timestamp);
        return d >= start && d <= end;
      });
    }

    return [];
  }, [completedOrders, salesFilter, selectedDate]);

  // 2) 주문건(비지출) 개수
  const orderCount = useMemo(
    () => filteredOrders.filter(o => !o.isExpense).length,
    [filteredOrders]
  );

  // 3) 상품별 주문건수 순위
  const rankings = useMemo(() => {
    const map = new Map<string, number>();
    filteredOrders
      .filter(o => !o.isExpense)
      .forEach(o => {
        o.items.forEach(i => {
          map.set(i.name, (map.get(i.name) || 0) + i.quantity);
        });
      });
    return Array.from(map.entries())
      .map(([name,count]) => ({ name, count }))
      .sort((a,b) => b.count - a.count);
  }, [filteredOrders]);

  // 기존 todaySales, dashboardSales, etc...
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.timestamp);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  const todaySales = todayOrders
    .filter(order => !order.isExpense)
    .reduce((sum, order) => sum + order.finalAmount, 0);

  const dashboardSales = filteredOrders
    .filter(order => !order.isExpense)
    .reduce((sum, order) => sum + order.finalAmount, 0);

  const headerSales = salesFilter === '오늘' ? todaySales : dashboardSales;

  const dashboardPurchases = filteredOrders
    .filter(order => !order.isExpense)
    .reduce((sum, order) => sum + (order.purchaseTotal ?? 0), 0);

  const dashboardOtherExpenses = filteredOrders
    .filter(order => order.isExpense)
    .reduce((sum, order) => sum - order.finalAmount, 0);

  const dashboardProfit = dashboardSales - dashboardPurchases - dashboardOtherExpenses;

  const hourlySalesData = useMemo(() => {
    const data = Array.from({ length: 24 }, (_, index) => ({
      hour: index,
      amount: 0
    }));
    filteredOrders.forEach(order => {
      if (!order.timestamp) return;
      const orderDate = new Date(order.timestamp);
      const hour = orderDate.getHours();
      if (hour >= 0 && hour < 24 && !order.isExpense) {
        data[hour].amount += Number(order.finalAmount || 0);
      }
    });
    return data;
  }, [filteredOrders]);

  const calculateInventoryRate = () => {
    if (filteredOrders.length === 0) return 0;
    const totalOrderedItems = filteredOrders
      .filter(order => !order.isExpense)
      .reduce((sum, order) => sum + order.items.length, 0);
    const totalMenuItems = completedOrders.length;
    return Math.round((totalOrderedItems / totalMenuItems) * 100);
  };

  const handleFilterChange = (filter: SalesFilter) => {
    setSalesFilter(filter);
    const now = new Date();
    if (filter === '오늘') {
      setSelectedDate(now);
    } else if (filter === '어제') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      setSelectedDate(yesterday);
    } else if (filter === '이번 주') {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      setSelectedDate(monday);
    } else if (filter === '이번 달') {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setSelectedDate(firstOfMonth);
    }
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    setSalesFilter('직접 선택');
  };

  const handleMonthButtonClick = () => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setSelectedDate(firstOfMonth);
    setSalesFilter('이번 달');
    setViewMode('day');
  };

  const handleYearButtonClick = () => {
    setViewMode('year');
  };

  const handleMonthSelect = (year: number, month: number) => {
    setSelectedDate(new Date(year, month - 1, 1));
    setViewMode('day');
  };

  const handleBarClick = (e: React.MouseEvent, data: { hour: number; amount: number }) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      amount: data.amount,
    });
  };

  return {
    salesFilter,
    selectedDate,
    viewMode,
    showDayDetailsModal,
    tooltip,
    filteredOrders,
    orderCount,   
    rankings,   
    todaySales,
    dashboardSales,
    headerSales,
    dashboardPurchases,
    dashboardOtherExpenses,
    dashboardProfit,
    hourlySalesData,
    setSalesFilter,
    setSelectedDate,
    setViewMode,
    setShowDayDetailsModal,
    setTooltip,
    getFilteredOrders: () => filteredOrders, 
    getProductRankings: () => rankings,     
    calculateInventoryRate,
    handleFilterChange,
    handleDateChange,
    handleMonthButtonClick,
    handleYearButtonClick,
    handleMonthSelect,
    handleBarClick
  };
};

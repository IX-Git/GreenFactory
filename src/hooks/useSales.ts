// hooks/useSales.ts
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

  const getFilteredOrders = (): Order[] => {
    if (salesFilter === '어제' || salesFilter === '오늘' || salesFilter === '직접 선택') {
      const compareDate = new Date(selectedDate);
      compareDate.setHours(0, 0, 0, 0);
      return completedOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === compareDate.getTime();
      });
    } else if (salesFilter === '이번 주') {
      const compareDate = new Date(selectedDate);
      const day = compareDate.getDay();
      const startOfWeek = new Date(compareDate);
      startOfWeek.setDate(compareDate.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return completedOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= startOfWeek && orderDate <= endOfWeek;
      });
    } else if (salesFilter === '이번 달') {
      const compareDate = new Date(selectedDate);
      const startOfMonth = new Date(compareDate.getFullYear(), compareDate.getMonth(), 1);
      const endOfMonth = new Date(compareDate.getFullYear(), compareDate.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return completedOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      });
    }
    return [];
  };

  const filteredOrders = getFilteredOrders();

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

  const getProductRankings = () => {
    const productCounts = new Map();
    filteredOrders
      .filter(order => !order.isExpense)
      .forEach(order => {
        order.items.forEach(item => {
          const currentCount = productCounts.get(item.name) || 0;
          productCounts.set(item.name, currentCount + item.quantity);
        });
      });
    return Array.from(productCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

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
    const filteredOrders = getFilteredOrders();
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
    getFilteredOrders,
    getProductRankings,
    calculateInventoryRate,
    handleFilterChange,
    handleDateChange,
    handleMonthButtonClick,
    handleYearButtonClick,
    handleMonthSelect,
    handleBarClick
  };
};

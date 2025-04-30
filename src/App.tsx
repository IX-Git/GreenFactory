import React, { useState, useMemo, useEffect } from 'react';
import './index.css';
import { format } from 'date-fns';

import { useAuth } from './hooks/useAuth';
import { useToast, useCurrentTime } from './utils/helpers';
import { useProducts } from './hooks/useProducts';
import { useOrders } from './hooks/useOrders';

import LoginPage from './components/Auth/LoginPage';
import Toast from './components/Common/Toast';

import OrderHistory from './components/Order/OrderHistory';
import OrderDetail from './components/Order/OrderDetail';
import OrderView from './components/Order/OrderView';
import DashboardView from './components/Dashboard/DashboardView';
import SalesDetailModal from './components/Modals/SalesDetailModal';


interface HistoryOrder {
  id: string;
  title: string;
  price: number;
  date: string;
  time: string;
  status: string;
  paymentMethod: string;
}

const ROLE_TABS: Record<string, Array<'주문' | '주문내역' | '현황'>> = {
  master: ['주문', '주문내역', '현황'],
  manager: ['주문내역', '현황'],
  casher: ['주문', '주문내역'],
};

const App: React.FC = () => {
  const { appUser, loadingAuth, loginError, handleLogin, handleLogout } = useAuth();
  const { showToast, toastMessage, showToastMessage } = useToast();
  const currentTime = useCurrentTime();

  const { menuItems } = useProducts();
  const { completedOrders } = useOrders(menuItems, showToastMessage);

  // SalesDetailModal 상태
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const availableTabs = appUser?.role ? ROLE_TABS[appUser.role] : [];
  const [activeTab, setActiveTab] = useState<'주문' | '주문내역' | '현황'>(availableTabs[0] || '주문');

  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const orderHistoryOrders = useMemo(
    () =>
      completedOrders.filter(
        o =>
          !o.isExpense &&
          format(o.timestamp, 'yyyy-MM-dd') === filterDate
      ),
    [completedOrders, filterDate]
  );

  const historyItems = useMemo<HistoryOrder[]>(() => {
    return orderHistoryOrders.map(o => {
      let title = '';
      if (o.items.length === 1) {
        title = `${o.items[0]?.name || '상품'}/총 1건`;
      } else if (o.items.length > 1) {
        title = `${o.items[0]?.name || '상품'} 등/총 ${o.items.length}건`;
      } else {
        title = `주문/총 0건`;
      }
      let status = o.orderStatus === '주문취소'
        ? '주문취소'
        : o.isExpense
          ? '지출'
          : '완료';
      return {
        id: o.id,
        title,
        price: o.totalAmount,
        date: format(o.timestamp, 'yyyy-MM-dd'),
        time: format(o.timestamp, 'HH:mm:ss'),
        status,
        paymentMethod: o.paymentMethod,
      };
    });
  }, [orderHistoryOrders]);  
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (historyItems.length === 0) {
      setSelectedOrderId(null);
    } else if (!historyItems.some(item => item.id === selectedOrderId)) {
      setSelectedOrderId(historyItems[0].id);
    }
  }, [historyItems]);

  const selectedOrder = useMemo(
    () => orderHistoryOrders.find(o => o.id === selectedOrderId) || null,
    [orderHistoryOrders, selectedOrderId]
  );

  const handleTabChange = (tab: '주문' | '주문내역' | '현황') => {
    if (availableTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      alert('권한이 없습니다.');
    }
  };

  if (loadingAuth) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  if (!appUser) {
    return <LoginPage onLogin={handleLogin} errorMessage={loginError} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 상단 탭 */}
      <header className="bg-slate-800 text-white p-4 flex justify-center relative">
        <div className="flex space-x-4">
          {availableTabs.map(tab => (
            <button
              key={tab}
              className={`px-6 py-2 ${activeTab === tab ? 'bg-slate-700' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="absolute right-4 underline"
        >
          로그아웃
        </button>
      </header>

      {/* Main 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 주문 탭 */}
        {activeTab === '주문' && (
          <OrderView
            appUser={appUser}
            currentTime={currentTime}
            showToastMessage={showToastMessage}
          />
        )}

        {/* 주문내역 탭 */}
        {activeTab === '주문내역' && (
          <>
            <div className="w-1/3 border-r bg-white">
              <OrderHistory
                orders={historyItems}
                selectedOrderId={selectedOrderId}
                onSelectOrder={setSelectedOrderId}
                filterDate={filterDate}
                setFilterDate={setFilterDate}
              />
            </div>
            <div className="flex-1 bg-white p-4 overflow-auto">
              {selectedOrder && (
                <OrderDetail
                  totalAmount={selectedOrder.finalAmount}
                  paymentMethod={selectedOrder.paymentMethod}
                  paymentTime={format(selectedOrder.timestamp, 'HH:mm:ss')}
                  orderNumber={selectedOrder.id}
                  orderDate={format(selectedOrder.timestamp, 'yyyy-MM-dd')}
                  orderStatus={selectedOrder.orderStatus ?? '완료'}
                  changeLogs={selectedOrder.changeLogs ?? []}
                  appUser={appUser}
                  items={selectedOrder.items.map(i => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price * i.quantity,
                  }))}
                  discount={selectedOrder.discount}
                  orderId={selectedOrder.id}
                  showToastMessage={showToastMessage}
                />
              )}
            </div>
          </>
        )}

        {/* 현황 탭 */}
        {activeTab === '현황' && (
          <>
            <DashboardView
              appUser={appUser}
              currentTime={currentTime}
              showToastMessage={showToastMessage}
              onShowSalesDetail={() => setShowSalesModal(true)}
              onChangeDate={setSelectedDate}
            />
            {showSalesModal && (
              <SalesDetailModal
                date={selectedDate}
                orders={completedOrders}
                onClose={() => setShowSalesModal(false)}
                onPrevDay={() => setSelectedDate(prev => {
                  const d = new Date(prev);
                  d.setDate(d.getDate() - 1);
                  return d;
                })}
                onNextDay={() => setSelectedDate(prev => {
                  const d = new Date(prev);
                  d.setDate(d.getDate() + 1);
                  return d;
                })}
              />
            )}
          </>
        )}
      </div>

      {/* Toast */}
      <Toast message={toastMessage} show={showToast} />
    </div>
  );
};

export default App;
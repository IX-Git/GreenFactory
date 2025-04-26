import React, { useState } from 'react';
import Avatar from '../Common/Avatar';
import PaymentMethodModal from '../Modals/PaymentMethodModal';
import CancelOrderModal from '../Modals/CancelOrderModal';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { AppUser } from '../../types';


interface ChangeLog {
  type: string;
  before?: string;
  after?: string;
  reason?: string;
  updatedAt: string;
  updatedBy: string;
}

interface OrderDetailProps {
  totalAmount: number;
  paymentMethod: string;
  paymentTime: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  discount?: number;
  orderId?: string; // Firestore 문서 id (for update)
  showToastMessage?: (msg: string) => void;
  changeLogs?: ChangeLog[];
  appUser?: AppUser;
  
}

const OrderDetail: React.FC<OrderDetailProps> = ({
  totalAmount,
  paymentMethod,
  paymentTime,
  orderNumber,
  orderDate,
  orderStatus,
  items,
  discount,
  orderId,
  showToastMessage,
  changeLogs = [],
  appUser,
  
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // 결제수단 변경
  const handleChangePaymentMethod = async (newMethod: string) => {
    if (!orderId) return;
    console.log('appUser:', appUser); // 디버깅용
    await updateDoc(doc(db, 'orders', orderId), {
      paymentMethod: newMethod,
      changeLogs: arrayUnion({
        type: "결제수단변경",
        before: paymentMethod,
        after: newMethod,
        updatedAt: new Date().toISOString(),
        updatedBy: appUser?.email || "unknown"
      })
    });
    setShowPaymentModal(false);
    if (showToastMessage) showToastMessage('결제수단이 변경되었습니다.');
  };

  // 주문 취소 처리
  const handleCancelOrder = async (reason: string) => {
    if (!orderId) return;
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: '주문취소',
      cancelReason: reason,
      changeLogs: arrayUnion({
        type: "주문취소",
        reason,
        updatedAt: new Date().toISOString(),
        updatedBy: appUser?.email || "unknown"
      })
    });
    setShowCancelModal(false);
    if (showToastMessage) showToastMessage('주문이 취소되었습니다.');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-sm text-gray-500 mb-1">총 주문금액</h2>
            <p className="text-2xl font-bold">{totalAmount.toLocaleString()}원</p>
          </div>
          {/* 버튼 및 결제수단 워딩 */}
          <div className="flex items-center space-x-2">
            {orderStatus === '주문취소' ? (
              <>
                <button
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm"
                  disabled
                >
                  영수증 출력
                </button>
              </>
            ) : (
              <>
                <button
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm"
                  onClick={() => setShowPaymentModal(true)}
                >
                  결제수단 변경
                </button>
                <button
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md text-sm"
                  disabled
                >
                  영수증 출력
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
                  onClick={() => setShowCancelModal(true)}
                >
                  주문 취소
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-4">카드결제</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">금액</span>
                <span className="font-medium">{totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">결제수단</span>
                <span className={`font-medium ${orderStatus === '주문취소' ? 'text-red-500' : ''}`}>
                  {orderStatus === '주문취소' ? '결제취소' : paymentMethod}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">주문시간</span>
                <span className="font-medium">{orderDate} {paymentTime}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">주문번호</span>
                <span className="font-medium">{orderNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">주문상태</span>
                <span className={`font-medium ${orderStatus === '주문취소' ? 'text-red-500' : ''}`}>
                  {orderStatus}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-4">주문내역</h3>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-800">{item.name} ({(item.price / item.quantity).toLocaleString()}원)</span>
                  <span className="font-medium">{item.price.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 border-b border-gray-100 text-red-500">
                <span>할인</span>
                <span>(-) {(discount ?? 0).toLocaleString()}원</span>
              </div>
            </div>
          </div>

          {/* 주문변경내역 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">주문변경내역</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              {changeLogs && changeLogs.length > 0 ? (
                changeLogs.map((log, i) => (
                  <div key={i} className="flex justify-between py-2">
                    <span className="text-gray-600">
                      {log.type === "결제수단변경"
                        ? `결제수단 변경 (${log.before} > ${log.after})`
                        : log.type === "주문취소"
                        ? `주문 취소${log.reason ? ` (${log.reason})` : ''}`
                        : log.type}
                    </span>
                    <span className="font-medium">
                      {log.updatedAt ? format(new Date(log.updatedAt), 'yyyy-MM-dd HH:mm') : ''}
                      {log.updatedBy ? ` (${log.updatedBy})` : ''}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-gray-400">변경 이력이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 결제수단 변경 모달 */}
      <PaymentMethodModal
        open={showPaymentModal}
        currentMethod={paymentMethod}
        onClose={() => setShowPaymentModal(false)}
        onChange={handleChangePaymentMethod}
      />

      {/* 주문 취소 모달 */}
      <CancelOrderModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onCancel={handleCancelOrder}
      />
    </div>
  );
};

export default OrderDetail;

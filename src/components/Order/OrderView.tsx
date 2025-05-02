import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { AppUser } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrders';
import OrderList from './OrderList';
import OrderItem from './OrderItem';
import { DiscountModal } from '../Modals/DiscountModal';
import { ExpenseModal } from '../Modals/ExpenseModal';
import { ConfirmationModal } from '../Modals/ConfirmationModal';

interface OrderViewProps {
  appUser: AppUser;
  currentTime: Date;
  showToastMessage: (message: string) => void;
}

const OrderView: React.FC<OrderViewProps> = ({
  appUser,
  currentTime,
  showToastMessage,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('');
  const [initializedCategory, setInitializedCategory] = useState(false);

  const { productCategories, displayedCategories } = useCategories();
  const { menuItems } = useProducts();

  // 필터링 및 페이지네이션
  const filteredItems = productCategories.find(cat => cat.name === activeCategory)?.enabled
    ? menuItems.filter(item => item.category === activeCategory)
    : [];
  const itemsPerPage = 24;
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const {
    orderItems,
    expenses,
    discount,
    setDiscount,
    showDiscountModal,
    setShowDiscountModal,
    discountAmount,
    setDiscountAmount,
    showExpenseModal,
    setShowExpenseModal,
    expenseAmount,
    setExpenseAmount,
    expenseDescription,
    setExpenseDescription,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    itemToDelete,
    setItemToDelete,
    expenseToDelete,
    setExpenseToDelete,
    addToOrder,
    updateQuantity,
    removeOrderItem,
    processOrder,
    subtotal,
    total,
    totalExpenses,
    todaySales,
  } = useOrders(menuItems, showToastMessage);

  // 카테고리 초기화
  useEffect(() => {
    if (!initializedCategory && displayedCategories.length > 0) {
      setActiveCategory(displayedCategories[0].name);
      setInitializedCategory(true);
    }
  }, [displayedCategories, initializedCategory]);

  return (
    <div className="flex flex-1">
      {/* 왼쪽 메뉴 영역 */}
      <div className="w-3/4 flex flex-col">
        {/* 카테고리 탭 */}
        <div className="flex overflow-x-auto bg-white border-b">
          {displayedCategories.map(category => (
            <button
              key={category.id}
              className={`px-6 py-4 whitespace-nowrap font-medium ${
                activeCategory === category.name
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              } ${expenses.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (expenses.length === 0) {
                  setActiveCategory(category.name);
                  setCurrentPage(1);
                }
              }}
              disabled={expenses.length > 0}
            >
              {category.name}
            </button>
          ))}
        </div>

       {/* 메뉴 그리드 */}
       {!activeCategory ? (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
            카테고리를 선택해주세요
        </div>
        ) : currentItems.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
            등록된 상품이 없습니다
        </div>
        ) : (
        <div className="grid grid-cols-6 gap-[12px] p-4 overflow-y-auto flex-1">
            {currentItems.map(item => (
            <button
                key={item.id}
                className="bg-white shadow border rounded-lg relative overflow-hidden"
                style={{ width: '137px', height: '137px', borderWidth: '1px' }}
                onClick={() => addToOrder(item)}
                disabled={expenses.length > 0}
            >
                {/* 상품명 */}
                <div
                  className="absolute text-left whitespace-nowrap text-sm font-medium"
                  style={{ top: '8px', left: '8px', width: '121px', height: '24px' }}
                >
                  {item.name}
                </div>
                {/* 가로 재고 바 */}
                <div
                  className="absolute text-left bg-gray-200 rounded-full"
                  style={{ top: '73px', left: '8px', width: '121px', height: '8px' }}
                >
                  <div
                    className="bg-blue-500 rounded-full h-full"
                    style={{
                      width: `${item.totalStock > 0 ? ((item.remainingStock / item.totalStock) * 100).toFixed(0) : 0}%`
                    }}
                  />
                </div>
                {/* 남은 재고 개수 */}
                <div
                  className="absolute text-left text-xs text-red-500 whitespace-nowrap"
                  style={{ top: '85px', left: '8px', width: '121px', height: '20px' }}
                >
                  {item.remainingStock}개 남음
                </div>
                {/* 가격 */}
                <div
                  className="absolute text-left text-sm text-gray-700 whitespace-nowrap"
                  style={{ top: '107px', left: '8px', width: '121px', height: '22px' }}
                >
                  {(item.salesPrice ?? 0).toLocaleString()}원
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 주문 하단 영역: 할인/지출 + 페이지네이션 */}
        <div className="bg-white p-4 border-t flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${
                orderItems.length > 0
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={() => setShowDiscountModal(true)}
              disabled={orderItems.length === 0}
            >
              할인 적용
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                orderItems.length === 0
                  ? 'bg-[#FFFBE6] text-[#FF8F1F] border border-[#EEEEEE]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={() => setShowExpenseModal(true)}
              disabled={orderItems.length > 0}
            >
              기타 지출
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className={`w-8 h-8 flex items-center justify-center border rounded-md ${
                expenses.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || expenses.length > 0}
            >
              &lt;
            </button>
            <span className="px-2">{currentPage}</span>
            <button
              className={`w-8 h-8 flex items-center justify-center border rounded-md ${
                expenses.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || expenses.length > 0}
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽 주문 내역 영역 */}
      <div className="w-1/4 bg-white border-l flex flex-col">
        <div className="p-3 border-b flex justify-between items-center bg-gray-50">
          <span>{format(currentTime, 'yyyy-MM-dd HH:mm:ss')}</span>
          <span className="font-bold">{todaySales.toLocaleString()}원</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {orderItems.length === 0 ? (
            expenses.length > 0 ? (
              expenses.map(expense => (
                <div key={expense.id} className="p-3 border-b bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span className="font-medium">{expense.description}</span>
                    </div>
                    <button
                      className="text-red-500"
                      onClick={() => {
                        setExpenseToDelete(expense.id);
                        setShowDeleteConfirmation(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-right">(-) {expense.amount.toLocaleString()}원</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">주문서가 비어있습니다</p>
              </div>
            )
          ) : (
            orderItems.map(item => (
              <div key={item.id} className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <button className="p-1 rounded bg-gray-100" onClick={() => updateQuantity(item.id, -1)}>
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity || 1}</span>
                    <button className="p-1 rounded bg-gray-100" onClick={() => updateQuantity(item.id, 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="text-red-500"
                    onClick={() => {
                      setItemToDelete(item.id);
                      setShowDeleteConfirmation(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="whitespace-nowrap">{item.name}</span>
                  <span className="whitespace-nowrap">{(((item.salesPrice ?? 0)) * (item.quantity || 1)).toLocaleString()}원</span>
                </div>
              </div>
            ))
          )}
          {discount > 0 && (
            <div className="p-3 border-b text-red-500">
              <div className="flex justify-between">
                <span>할인</span>
                <span>-{discount.toLocaleString()}원</span>
              </div>
            </div>
          )}
        </div>
        <div className="border-t p-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              className={`bg-blue-100 text-blue-700 py-2 rounded-md ${expenses.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => processOrder('현금')}
              disabled={orderItems.length === 0 || expenses.length > 0}
            >
              현금
            </button>
            <button
              className={`bg-blue-100 text-blue-700 py-2 rounded-md ${expenses.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => processOrder('계좌이체')}
              disabled={orderItems.length === 0 || expenses.length > 0}
            >
              계좌이체
            </button>
            <button
              className={`bg-blue-100 text-blue-700 py-2 rounded-md ${expenses.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => processOrder('외상')}
              disabled={orderItems.length === 0 || expenses.length > 0}
            >
              외상
            </button>
          </div>
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-md"
            onClick={() => processOrder('카드')}
            disabled={orderItems.length === 0 && expenses.length === 0}
          >
            {orderItems.length === 0 && expenses.length > 0
              ? `(-) ${totalExpenses.toLocaleString()}원 지출 등록`
              : `${(subtotal - discount).toLocaleString()}원 결제`}
          </button>
        </div>
      </div>

      {/* 할인 모달 */}
      {showDiscountModal && (
        <DiscountModal
          discountAmount={discountAmount}
          setDiscountAmount={setDiscountAmount}
          onApply={() => {
            setDiscount(parseInt(discountAmount || '0'));
            setShowDiscountModal(false);
            showToastMessage('할인이 적용되었습니다');
          }}
          onCancel={() => setShowDiscountModal(false)}
        />
      )}

      {/* 지출 모달 */}
      {showExpenseModal && (
        <ExpenseModal
          expenseAmount={expenseAmount}
          setExpenseAmount={setExpenseAmount}
          expenseDescription={expenseDescription}
          setExpenseDescription={setExpenseDescription}
          onApply={() => {
            if (expenseAmount && expenseDescription.trim()) {
              const expense = {
                id: Date.now(),
                description: expenseDescription,
                amount: parseInt(expenseAmount),
              };
              expenses.push(expense);
              setShowExpenseModal(false);
              setExpenseAmount('');
              setExpenseDescription('');
              showToastMessage('지출이 추가되었습니다');
            }
          }}
          onCancel={() => setShowExpenseModal(false)}
        />
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirmation && (
        <ConfirmationModal
          message={
            itemToDelete !== null
              ? '해당 상품을 삭제할까요?'
              : '해당 지출 항목을 삭제할까요?'
          }
          onConfirm={() => {
            if (itemToDelete !== null) {
              removeOrderItem(itemToDelete);
            } else if (expenseToDelete !== null) {
              const newExpenses = expenses.filter(exp => exp.id !== expenseToDelete);
              expenses.length = 0;
              expenses.push(...newExpenses);
              showToastMessage('지출 항목이 삭제되었습니다');
            }
            setShowDeleteConfirmation(false);
            setItemToDelete(null);
            setExpenseToDelete(null);
          }}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setItemToDelete(null);
            setExpenseToDelete(null);
          }}
          confirmText={itemToDelete !== null ? '상품 삭제' : '지출 항목 삭제'}
        />
      )}
    </div>
  );
};

export default OrderView;
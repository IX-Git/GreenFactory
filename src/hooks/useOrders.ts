// src/hooks/useOrders.ts
import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { Order, MenuItem, Expense } from '../types';

export const useOrders = (
  menuItems: MenuItem[],
  showToastMessage: (message: string) => void
) => {
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<MenuItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [discount, setDiscount] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountAmount, setDiscountAmount] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

  // 실시간 Firestore 구독 (onSnapshot)
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: Order[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, 
          docId: doc.id,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentTime: data.paymentTime || '',
          orderNumber: data.orderNumber || 0,
          orderDate: data.orderDate || '',
          orderStatus: data.orderStatus ?? '완료',
          items: data.items || [],
          discount: data.discount || 0,
          finalAmount: data.finalAmount,
          changeLogs: data.changeLogs || [],
          timestamp: data.timestamp
            ? (typeof data.timestamp.toDate === 'function'
                ? data.timestamp.toDate()
                : new Date(data.timestamp))
            : new Date(),
          isExpense: data.isExpense,
          purchaseTotal: data.purchaseTotal,
          memo: data.memo || '',
        };
      });
      setCompletedOrders(orders);
    }, err => console.error('주문 구독 에러:', err));

    return () => unsubscribe();
  }, []);

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const todaySales = useMemo(() => {
    const todayOrders = completedOrders.filter(order => {
      const d = new Date(order.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    return todayOrders
      .filter(order => !order.isExpense)
      .reduce((sum, order) => sum + order.finalAmount, 0);
  }, [completedOrders, today]);

  const addToOrder = (item: MenuItem) => {
    if (expenses.length > 0) {
      showToastMessage('지출이 등록된 상태에서는 상품을 추가할 수 없습니다');
      return;
    }
    if (item.remainingStock <= 0) {
      showToastMessage('재고가 부족합니다');
      return;
    }
    setOrderItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, change: number) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + change) }
          : item
      )
    );
  };

  const removeOrderItem = (id: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
    showToastMessage('상품이 삭제되었습니다');
  };

  const processOrder = async (paymentMethod: string) => {
    try {
      if (expenses.length > 0) {
        await Promise.all(
          expenses.map(exp =>
            addDoc(collection(db, 'orders'), {
              items: [],
              totalAmount: -exp.amount,
              discount: 0,
              finalAmount: -exp.amount,
              paymentMethod: '지출',
              timestamp: serverTimestamp(),
              isExpense: true,
              memo: exp.description,
            })
          )
        );
        setExpenses([]);
        showToastMessage('지출이 등록되었습니다');
        return;
      }

      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.salesPrice * (item.quantity || 1),
        0
      );
      const finalAmount = Math.max(0, subtotal - discount);
      const purchaseTotal = orderItems.reduce(
        (sum, item) => sum + item.purchasePrice * (item.quantity || 1),
        0
      );

      const ref = await addDoc(collection(db, 'orders'), {
        items: orderItems.map(i => ({
          id: String(menuItems.find(m => m.id === i.id)?.docId),
          name: i.name,
          price: i.salesPrice,
          quantity: i.quantity,
        })),
        totalAmount: subtotal,
        discount,
        finalAmount,
        paymentMethod,
        timestamp: serverTimestamp(),
        purchaseTotal,
      });

      await Promise.all(
        orderItems.map(item => {
          if (!item.docId) return Promise.resolve();
          const itemRef = doc(db, 'menuItems', item.docId);
          return updateDoc(itemRef, {
            remainingStock: increment(-(item.quantity || 0)),
          });
        })
      );

      setOrderItems([]);
      setDiscount(0);
      showToastMessage('주문이 완료되었습니다');
    } catch (error) {
      showToastMessage('오류가 발생했습니다. 콘솔을 확인하세요.');
    }
  };

  const subtotal = orderItems.reduce(
    (sum, item) => sum + (item.salesPrice ?? 0) * (item.quantity || 1),
    0
  );
  const total = Math.max(0, subtotal - discount);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    completedOrders,
    orderItems,
    setOrderItems,
    expenses,
    setExpenses,
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
  };
};
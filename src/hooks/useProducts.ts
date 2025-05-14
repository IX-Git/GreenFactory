// hooks/useProducts.ts
import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { MenuItem } from '../types';

export const useProducts = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    price: '',
    salesPrice: '',
    salesStock: '',
  });
  const [editProduct, setEditProduct] = useState({
    name: '',
    category: '',
    purchasePrice: '',
    salesPrice: '',
    quantity: ''
  });
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [isProductAddModalOpen, setIsProductAddModalOpen] = useState(false);
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isProductDeleteModalOpen, setIsProductDeleteModalOpen] = useState(false);

  // 매일 00시에 재고를 초기화하는 함수
  const resetInventoryDaily = async () => {
    try {
      // 현재 시간 확인
      const now = new Date();
      const hours = now.getHours(); 

       // 현재 시간이 00시인 경우에만 실행
      if (hours === 0) {
    console.log("재고 초기화 시작");
    
    // 모든 메뉴 아이템에 대해 재고 초기화
    menuItems.forEach(async (item) => {
      if (item.docId) {
        const docRef = doc(db, "menuItems", item.docId);
        await updateDoc(docRef, {
          remainingStock: 0,
          lastResetDate: Timestamp.now()
        });
        
        // 재고 초기화 기록 추가 (inventory 컬렉션이 있다고 가정)
        await addDoc(collection(db, "inventory"), {
          productId: item.docId,
          productName: item.name,
          type: '초기화',
          reason: '일일 재고 초기화',
          adjustment: -item.remainingStock,
          afterStock: 0,
          timestamp: Timestamp.now()
        });
      }
    });
    console.log("재고 초기화 완료");
  }
} catch (error) {
  console.error("재고 초기화 중 오류 발생:", error);
}

  };

  useEffect(() => {

    // 매일 00시에 재고 초기화를 위한 타이머 설정
    const checkAndResetInventory = () => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(nextMidnight.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

    // 00시가 되면 재고 초기화
    setTimeout(() => {
    resetInventoryDaily();
    // 재귀적으로 다음 날 00시에도 실행
    checkAndResetInventory();
  }, timeUntilMidnight);
};

    // 앱이 시작될 때 한 번 실행
    checkAndResetInventory();

    
    const q = query(collection(db, "menuItems"), orderBy("id", "desc"));
    return onSnapshot(q, snap => {
      setMenuItems(snap.docs.map(d => {
        const data = d.data();
        return { 
          docId: d.id, 
          id: data.id, 
          name: data.name, 
          purchasePrice: data.purchasePrice, 
          salesPrice: data.salesPrice, 
          category: data.category, 
          remainingStock: data.remainingStock, 
          totalStock: data.totalStock, 
          quantity: data.quantity ?? 0,
          timestamp: data.timestamp || new Date().getTime(), 
        } as MenuItem;
      }));
    }, (err) => console.error("메뉴 구독 에러:", err));
  }, []);

  const handleAddProduct = async () => {
    try {
      await addDoc(collection(db, "menuItems"), {
        id: Date.now(),
        name: newProduct.name,
        purchasePrice: Number(newProduct.price),
        salesPrice: Number(newProduct.salesPrice),
        category: newProduct.category,
        remainingStock: Number(newProduct.salesStock),
        totalStock: Number(newProduct.salesStock),
        timestamp : Timestamp.now()
      });
      setIsProductAddModalOpen(false);
    } catch (e) {
    }
  };

  const handleEditClickProduct = (item: MenuItem) => {
    setSelectedProduct(item);
    setEditProduct({
      name: item.name,
      category: item.category,
      purchasePrice: item.purchasePrice.toString(),
      salesPrice: item.salesPrice.toString(),
      quantity: item.quantity ? item.quantity.toString() : ''
    });
    setIsProductEditModalOpen(true);
  };

  const handleEditProduct = async () => {
    if (!selectedProduct?.docId) return;
    const docRef = doc(db, "menuItems", selectedProduct.docId);
    await updateDoc(docRef, {
      name: editProduct.name,
      purchasePrice: Number(editProduct.purchasePrice),
      salesPrice: Number(editProduct.salesPrice),
      remainingStock: Number(editProduct.quantity || 0),
      totalStock: Number(editProduct.quantity || 0),
      timestamp: Timestamp.now()
    });
    setIsProductEditModalOpen(false);
    setSelectedProduct(null);
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct?.docId) return;
    await deleteDoc(doc(db, "menuItems", selectedProduct.docId));
    setIsProductDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  // 정렬 함수 추가
  const getSortedProducts = (sortType: string) => {
  let sorted = [...menuItems];
  if (sortType === 'latest') {
  // id는 타임스탬프 기반으로 생성되므로 id로 내림차순 정렬
  return sorted.sort((a, b) => b.id - a.id);
  } else if (sortType === 'low') {
  return sorted.sort((a, b) => (a.remainingStock || 0) - (b.remainingStock || 0));
  } else if (sortType === 'high') {
  return sorted.sort((a, b) => (b.remainingStock || 0) - (a.remainingStock || 0));
  }
  return sorted;
  };

  return {
    menuItems,
    newProduct,
    setNewProduct,
    editProduct,
    setEditProduct,
    selectedProduct,
    setSelectedProduct,
    isProductAddModalOpen,
    setIsProductAddModalOpen,
    isProductEditModalOpen,
    setIsProductEditModalOpen,
    isProductDeleteModalOpen,
    setIsProductDeleteModalOpen,
    handleAddProduct,
    handleEditClickProduct,
    handleEditProduct,
    handleDeleteProduct,
    getSortedProducts,
    resetInventoryDaily
  };
};

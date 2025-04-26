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
  doc 
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

  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("id", "asc"));
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
          quantity: data.quantity ?? 0 
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
      });
      setIsProductAddModalOpen(false);
    } catch (e) {
      console.error("❌ 상품 추가 오류:", e);
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
    handleDeleteProduct
  };
};

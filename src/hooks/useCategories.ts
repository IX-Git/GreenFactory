// hooks/useCategories.ts
import { useState, useEffect, useMemo } from 'react';
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
import { Category } from '../types';

export const useCategories = () => {
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingText, setEditingText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryPage, setCategoryPage] = useState(1);
  const categoriesPerPage = 10;

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("id", "asc"));
    return onSnapshot(q, (snap) => {
      setProductCategories(snap.docs.map(d => ({ 
        docId: d.id, 
        ...d.data() 
      } as Category)));
    }, (err) => console.error(err));
  }, []);

  // displayedCategories 계산 - 활성화된 카테고리만 필터링
  const displayedCategories = useMemo(() => {
    return productCategories
      .filter(cat => cat.enabled)
      .sort((a, b) => {
        // 정렬 로직 (필요한 경우)
        return 0;
      });
  }, [productCategories]);

  const handleToggle = async (cat: Category) => {
    if (!cat.docId) return;
    await updateDoc(doc(db, "categories", cat.docId), {
      enabled: !cat.enabled
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, "categories"), {
        id: Date.now(),
        name: newCategoryName.trim(),
        enabled: true,
        inOrders: false
      });
      setNewCategoryName("");
      setIsModalOpen(false);
    } catch (e) {
      console.error("카테고리 추가 오류:", e);
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setEditingText(category.name);
  };

  const handleEditSave = async (cat: Category) => {
    if (!cat.docId || !editingText.trim()) return;
    await updateDoc(doc(db, "categories", cat.docId), {
      name: editingText.trim()
    });
    setEditingCategory(null);
    setEditingText("");
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditingText('');
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory?.docId) return;
    await deleteDoc(doc(db, "categories", selectedCategory.docId));
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
  };

  const totalCategoryPages = Math.ceil(productCategories.length / categoriesPerPage);
  const currentCategories = productCategories.slice(
    (categoryPage - 1) * categoriesPerPage,
    categoryPage * categoriesPerPage
  );

  return {
    productCategories,
    newCategoryName,
    setNewCategoryName,
    editingCategory,
    editingText,
    setEditingText,
    selectedCategory,
    isModalOpen,
    isDeleteModalOpen,
    categoryPage,
    setCategoryPage,
    totalCategoryPages,
    currentCategories,
    displayedCategories, 
    handleToggle,
    handleAddCategory,
    handleEditClick,
    handleEditSave,
    handleEditCancel,
    handleDeleteClick,
    handleDeleteConfirm,
    setIsModalOpen,
    setIsDeleteModalOpen
  };
};

import React, { useState, useEffect } from 'react';
import { Plus as PlusIcon, X } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from '../../firebase';

interface Category {
  docId?: string;
  id: number;
  name: string;
  enabled: boolean;
  inOrders?: boolean;
}

interface CategoryManagementProps {
    showToastMessage: (msg: string) => void;
  }

  const CategoryManagement: React.FC<CategoryManagementProps> = ({ showToastMessage }) => {
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [categoryPage, setCategoryPage] = useState(1);
  const categoriesPerPage = 10;

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Firestore 카테고리 구독
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("id", "asc"));
    return onSnapshot(q, snap => {
      setProductCategories(snap.docs.map(d => ({ docId: d.id, ...(d.data() as any) } as Category)));
    });
  }, []);

  const totalCategoryPages = Math.ceil(productCategories.length / categoriesPerPage);
  const currentCategories = productCategories.slice(
    (categoryPage - 1) * categoriesPerPage,
    categoryPage * categoriesPerPage
  );

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addDoc(collection(db, "categories"), {
      id: Date.now(),
      name: newCategoryName.trim(),
      enabled: true,
      inOrders: false,
    });
    setNewCategoryName('');
    setIsModalOpen(false);
  };

  // 카테고리 수정
  const handleEditClick = (cat: Category) => {
    setEditingCategory(cat);
    setEditingText(cat.name);
  };
  const handleEditSave = async (cat: Category) => {
    if (!cat.docId || !editingText.trim()) return;
    await updateDoc(doc(db, "categories", cat.docId), {
      name: editingText.trim(),
    });
    setEditingCategory(null);
    setEditingText('');
  };
  const handleEditCancel = () => {
    setEditingCategory(null);
    setEditingText('');
  };

  // 카테고리 삭제
  const handleDeleteClick = (cat: Category) => {
    setSelectedCategory(cat);
    setIsDeleteModalOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!selectedCategory?.docId) return;
    await deleteDoc(doc(db, "categories", selectedCategory.docId));
    setIsDeleteModalOpen(false);
    setSelectedCategory(null);
  };

  // 스위치 토글
  const handleToggle = async (cat: Category) => {
    if (!cat.docId) return;
    await updateDoc(doc(db, "categories", cat.docId), {
      enabled: !cat.enabled,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">카테고리</h1>
        <button
          onClick={() => {
            setNewCategoryName('');
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          카테고리 추가
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-medium">카테고리명</div>
            <div className="text-lg font-medium">주문 확인 노출</div>
          </div>
          {currentCategories.map((category) => (
            <div key={category.id} className="flex justify-between items-center py-4 border-t">
              {editingCategory?.id === category.id ? (
                <>
                  <input
                    type="text"
                    value={editingText}
                    onChange={e => setEditingText(e.target.value)}
                    className="flex-1 p-1 border rounded mr-2"
                    autoFocus
                  />
                  <button
                    onClick={() => handleEditSave(category)}
                    disabled={!editingText.trim()}
                    className={`px-3 py-1 text-sm rounded ${editingText.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    저장
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 ml-2"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <div>{category.name}</div>
                  <div className="flex items-center space-x-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={category.enabled}
                        onChange={() => handleToggle(category)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                    <button
                      onClick={() => handleEditClick(category)}
                      className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="px-3 py-1 text-sm text-red-500 bg-red-50 rounded hover:bg-red-100"
                    >
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {productCategories.length > categoriesPerPage && (
            <div className="flex justify-end mt-4">
              <button
                className="px-3 py-1 border rounded mr-2"
                onClick={() => setCategoryPage(Math.max(1, categoryPage - 1))}
                disabled={categoryPage === 1}
              >
                &lt;
              </button>
              <span className="px-2">{categoryPage}</span>
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setCategoryPage(Math.min(totalCategoryPages, categoryPage + 1))}
                disabled={categoryPage === totalCategoryPages}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 카테고리 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">카테고리 추가</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewCategoryName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <input
              type="text"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="카테고리명"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-6"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                className={`px-4 py-2 rounded-lg ${
                  newCategoryName.trim()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카테고리 삭제 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-[400px]">
            <h3 className="text-center text-lg mb-6">해당 카테고리를 삭제할까요?</h3>
            <div className="flex flex-col gap-2">
                <button
                onClick={handleDeleteConfirm}
                className="w-full py-2 text-white bg-red-500 rounded"
                >
                카테고리 삭제
                </button>
                <button
                onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedCategory(null);
                }}
                className="w-full py-2 text-gray-600 bg-gray-100 rounded"
                >
                취소
                </button>
            </div>
            </div>
        </div>
        )}

    </div>
  );
};

export default CategoryManagement;

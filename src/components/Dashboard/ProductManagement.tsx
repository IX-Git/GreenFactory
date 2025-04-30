import React, { useState, useEffect } from 'react';
import { Plus as PlusIcon, Pencil, Trash2, X } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from '../../firebase';

interface Category {
  docId?: string;
  id: number;
  name: string;
  enabled: boolean;
}
interface MenuItem {
  docId?: string;
  id: number;
  name: string;
  category: string;
  purchasePrice: number;
  salesPrice: number;
  remainingStock: number;
  totalStock: number;
}

interface ProductManagementProps {
  showToastMessage: (msg: string) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ showToastMessage }) => {
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isProductAddModalOpen, setIsProductAddModalOpen] = useState(false);
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isProductDeleteModalOpen, setIsProductDeleteModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState<any>({
    name: "",
    category: "",
    price: "",
    salesPrice: "",
    salesStock: "",
  });
  const [editProduct, setEditProduct] = useState<any>({
    docId: "",
    name: "",
    category: "",
    purchasePrice: "",
    salesPrice: "",
    quantity: "",
  });
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);

  // Firestore 카테고리 구독
  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("id", "asc"));
    return onSnapshot(q, snap => {
      setProductCategories(snap.docs.map(d => ({ docId: d.id, ...(d.data() as any) } as Category)));
    });
  }, []);

  // Firestore 메뉴 구독
  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("id", "asc"));
    return onSnapshot(q, snap => {
      setMenuItems(snap.docs.map(d => {
        const data = d.data() as any;
        return {
          docId: d.id,
          id: data.id,
          name: data.name,
          purchasePrice: data.purchasePrice,
          salesPrice: data.salesPrice,
          category: data.category,
          remainingStock: data.remainingStock,
          totalStock: data.totalStock,
        } as MenuItem;
      }));
    });
  }, []);

  // 상품 추가
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.category || !newProduct.price || !newProduct.salesPrice || !newProduct.salesStock) return;
    await addDoc(collection(db, "menuItems"), {
      id: Date.now(),
      name: newProduct.name.trim(),
      category: newProduct.category,
      purchasePrice: parseInt(newProduct.price),
      salesPrice: parseInt(newProduct.salesPrice),
      remainingStock: parseInt(newProduct.salesStock),
      totalStock: parseInt(newProduct.salesStock),
    });
    setIsProductAddModalOpen(false);
    setNewProduct({ name: "", category: "", price: "", salesPrice: "", salesStock: "" });
  };

  // 상품 수정
  const handleEditClickProduct = (item: MenuItem) => {
    setEditProduct({
      docId: item.docId,
      name: item.name,
      category: item.category,
      purchasePrice: item.purchasePrice,
      salesPrice: item.salesPrice,
      quantity: item.totalStock,
    });
    setIsProductEditModalOpen(true);
  };
  const handleEditProduct = async () => {
    if (!editProduct.docId || !editProduct.name.trim() || !editProduct.category || !editProduct.purchasePrice || !editProduct.salesPrice || !editProduct.quantity) return;
    await updateDoc(doc(db, "menuItems", editProduct.docId), {
      name: editProduct.name.trim(),
      category: editProduct.category,
      purchasePrice: parseInt(editProduct.purchasePrice),
      salesPrice: parseInt(editProduct.salesPrice),
      totalStock: parseInt(editProduct.quantity),
      remainingStock: parseInt(editProduct.quantity), // 재고 초기화
    });
    setIsProductEditModalOpen(false);
    setEditProduct({ docId: "", name: "", category: "", purchasePrice: "", salesPrice: "", quantity: "" });
  };

  // 상품 삭제
  const handleDeleteProduct = async () => {
    if (!selectedProduct?.docId) return;
    await deleteDoc(doc(db, "menuItems", selectedProduct.docId));
    setIsProductDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="max-w-7xl mx-auto mt-8">
      {/* 상단: 상품 관리 워딩 & 상품 추가 버튼 (카드 바깥) */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">상품 관리</h2>
        <button
          onClick={() => {
            setNewProduct({
              name: "",
              category: "",
              price: "",
              salesPrice: "",
              salesStock: "",
            });
            setIsProductAddModalOpen(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon size={20} />
          상품 추가
        </button>
      </div>
      {/* 하얀색 카드 영역 */}
      <div className="bg-white rounded-lg shadow p-6">
        {productCategories.filter(cat => cat.enabled).map(cat => {
          const catItems = menuItems.filter(i => i.category === cat.name);
          return (
            <div key={cat.id} className="mb-6">
              <h3 className="text-xl font-semibold mb-2">{cat.name}</h3>
              {catItems.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  해당 카테고리에 상품이 없습니다.
                </div>
              ) : (
                catItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border-b">
                    <div className="flex-1">
                      <span className="font-medium whitespace-nowrap">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleEditClickProduct(item)}>
                        <Pencil className="text-gray-500 hover:text-blue-500" size={20} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setIsProductDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="text-gray-500 hover:text-red-500" size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {/* 상품 추가 모달 */}
      {isProductAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[500px] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">새 상품 등록</h3>
              <button onClick={() => setIsProductAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="(필수) 상품 이름을 입력해 주세요"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">카테고리 선택</option>
                  {productCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="(필수) 사입 금액을 입력해 주세요"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="(필수) 판매 가격을 입력해 주세요"
                  value={newProduct.salesPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, salesPrice: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  placeholder="(필수) 판매 재고 수량을 입력해 주세요"
                  value={newProduct.salesStock}
                  onChange={(e) => setNewProduct({ ...newProduct, salesStock: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">개</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
              <button
                onClick={() => setIsProductAddModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 수정 모달 */}
      {isProductEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-[500px] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">상품 수정</h3>
              <button onClick={() => setIsProductEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <input 
                  type="text" 
                  placeholder="(필수) 상품 이름을 입력해 주세요"
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select 
                  value={editProduct.category}
                  onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">카테고리 선택</option>
                  {productCategories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="(필수) 사입 금액을 입력해 주세요"
                  value={editProduct.purchasePrice}
                  onChange={(e) => setEditProduct({ ...editProduct, purchasePrice: e.target.value })}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="(필수) 판매 가격을 입력해 주세요"
                  value={editProduct.salesPrice}
                  onChange={(e) => setEditProduct({ ...editProduct, salesPrice: e.target.value })}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">원</span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="(필수) 판매 재고 수량을 입력해 주세요"
                  value={editProduct.quantity}
                  onChange={(e) => setEditProduct({ ...editProduct, quantity: e.target.value })}
                  className="w-full p-3 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">개</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-6 border-t bg-gray-50">
              <button 
                onClick={() => setIsProductEditModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button 
                onClick={handleEditProduct}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 삭제 모달 */}
      {isProductDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[400px]">
            <h3 className="text-center text-lg mb-6">해당 상품을 삭제할까요?</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteProduct}
                className="w-full py-2 text-white bg-red-500 rounded"
              >
                상품 삭제
              </button>
              <button
                onClick={() => setIsProductDeleteModalOpen(false)}
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

export default ProductManagement;

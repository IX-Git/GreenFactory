import React, { ReactNode } from 'react';
import { BarChart3, Package, ShoppingBag, FolderOpen, Layers, Menu, FileText, BarChart } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

// SidebarItem 컴포넌트
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}
const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active }) => {
  return (
    <div 
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer
                ${active 
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                  : 'text-gray-700 hover:bg-gray-100'}`}
    >
      <div className={`mr-3 ${active ? 'text-blue-600' : 'text-gray-500'}`}>
        {icon}
      </div>
      {label}
    </div>
  );
};

// Sidebar 컴포넌트
const Sidebar: React.FC = () => {
  return (
    <div className="h-full bg-white">
      <div className="p-4">
        <div className="flex items-center mb-8">
          <span className="text-lg font-semibold text-gray-800">재고 관리 시스템</span>
        </div>
        <nav className="space-y-0.5">
          <SidebarItem icon={<BarChart3 size={20} />} label="현황" active={false} />
          <SidebarItem icon={<BarChart3 size={20} />} label="매출현황" active={false} />
          <SidebarItem icon={<BarChart3 size={20} />} label="매출집계" active={false} />
          <SidebarItem icon={<ShoppingBag size={20} />} label="상품 관리" active={false} />
          <SidebarItem icon={<Package size={20} />} label="상품" active={false} />
          <SidebarItem icon={<FolderOpen size={20} />} label="카테고리" active={false} />
          <SidebarItem icon={<Layers size={20} />} label="재고관리" active={true} />
        </nav>
      </div>
    </div>
  );
};

// TopNav 컴포넌트
interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}
const NavItem: React.FC<NavItemProps> = ({ icon, label, active }) => {
  return (
    <div className={`flex items-center px-3 py-2 text-sm font-medium cursor-pointer
                    ${active ? 'border-b-2 border-white' : 'text-gray-300 hover:text-white'}`}>
      <div className="mr-2">{icon}</div>
      {label}
    </div>
  );
};

const TopNav: React.FC = () => {
  return (
    <header className="bg-[#0a1929] text-white shadow">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-md hover:bg-blue-800 focus:outline-none">
            <Menu size={24} />
          </button>
          <div className="flex space-x-4">
            <NavItem icon={<FileText size={20} />} label="주문" />
            <NavItem icon={<BarChart size={20} />} label="현황" active />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* User profile or additional controls could go here */}
        </div>
      </div>
    </header>
  );
};

// Layout 메인 컴포넌트
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <TopNav />
      <div className="flex flex-1">
        <div className="w-[272px] border-r border-gray-200">
          <Sidebar />
        </div>
        <div className="flex flex-1">
          <div className="w-[353px] border-r">
            <div className="p-4">
              <div className="text-sm text-gray-500 mb-4">
                상품 관리 / 재고관리
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-6">재고관리</h1>
              <div className="space-y-4">
                <div className="flex space-x-0.5 border rounded-md overflow-hidden">
                  <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white">최신순</button>
                  <button className="px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">재고적은순</button>
                  <button className="px-4 py-2 text-sm font-medium bg-white text-gray-700 hover:bg-gray-100">재고많은순</button>
                </div>
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium">왕근빵기</div>
                      <div className="text-gray-600">과일 | 23,100원</div>
                    </div>
                    <div className="text-lg font-bold">7개</div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium">왕근빵기</div>
                      <div className="text-gray-600">과일 | 23,100원</div>
                    </div>
                    <div className="text-lg font-bold">20개</div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-medium">왕근빵기</div>
                      <div className="text-gray-600">과일 | 23,100원</div>
                    </div>
                    <div className="text-lg font-bold">16개</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;

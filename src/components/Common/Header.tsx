import React from 'react';
import { Menu, Clock } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-[#0A192F] text-white h-[56px] flex justify-center items-center">
      <div className="flex space-x-12">
        <button
          className={`flex items-center space-x-2 ${activeTab === '주문' ? 'opacity-100' : 'opacity-70'}`}
          onClick={() => setActiveTab('주문')}
        >
          <Menu size={18} />
          <span>주문</span>
        </button>
        <button
          className={`flex items-center space-x-2 ${activeTab === '주문내역' ? 'opacity-100' : 'opacity-70'}`}
          onClick={() => setActiveTab('주문내역')}
        >
          <Clock size={18} />
          <span>주문내역</span>
        </button>
        <button
          className={`flex items-center space-x-2 ${activeTab === '환불' ? 'opacity-100' : 'opacity-70'}`}
          onClick={() => setActiveTab('환불')}
        >
          <Clock size={18} />
          <span>현황</span>
        </button>
      </div>
    </header>
  );
};

export default Header
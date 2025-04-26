// src/App.tsx
import React, { useState } from 'react';
import './index.css';  // Tailwind 및 커스텀 CSS
import { useAuth } from './hooks/useAuth';
import { useToast, useCurrentTime } from './utils/helpers';
import LoginPage from './components/Auth/LoginPage';
import Toast from './components/Common/Toast';
import OrderView from './components/Order/OrderView';
import DashboardView from './components/Dashboard/DashboardView';
import { AppUser } from './types';

const App: React.FC = () => {
  const { appUser, loadingAuth, loginError, handleLogin, handleLogout } = useAuth();
  const { showToast, toastMessage, showToastMessage } = useToast();
  const currentTime = useCurrentTime();
  
  // 로그인 후, 권한에 따라 초기 뷰 결정
  const initialView: 'order' | 'dashboard' =
    appUser?.role === 'manager' ? 'dashboard' : 'order';
  const [activeView, setActiveView] = useState<'order' | 'dashboard'>(initialView);

  // 인증 로딩 중
  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        로딩 중...
      </div>
    );
  }

  // 로그인 안 된 경우
  if (!appUser) {
    return <LoginPage onLogin={handleLogin} errorMessage={loginError} />;
  }

  // 인증 완료된 경우 메인 레이아웃
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4 flex justify-center relative">
        <div className="flex space-x-4">
          {(appUser.role === 'master' || appUser.role === 'casher') && (
            <button
              className={`px-6 py-2 ${
                activeView === 'order' ? 'bg-slate-700 rounded-md' : ''
              }`}
              onClick={() => setActiveView('order')}
            >
              주문
            </button>
          )}
          {(appUser.role === 'master' || appUser.role === 'manager') && (
            <button
              className={`px-6 py-2 ${
                activeView === 'dashboard' ? 'bg-slate-700 rounded-md' : ''
              }`}
              onClick={() => setActiveView('dashboard')}
            >
              현황
            </button>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="absolute right-4 underline"
        >
          로그아웃
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {activeView === 'order' ? (
          <OrderView
            appUser={appUser as AppUser}
            currentTime={currentTime}
            showToastMessage={showToastMessage}
          />
        ) : (
          <DashboardView
            appUser={appUser as AppUser}
            currentTime={currentTime}
            showToastMessage={showToastMessage}
          />
        )}
      </div>

      {/* Toast Notification */}
      <Toast message={toastMessage} show={showToast} />
    </div>
  );
};

export default App;

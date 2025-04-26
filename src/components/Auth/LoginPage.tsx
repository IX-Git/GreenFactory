import React from 'react';
import LoginForm from './LoginForm';

interface LoginPageProps {
  onLogin: (email: string, pw: string) => Promise<void>;
  errorMessage: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, errorMessage }) => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <LoginForm onLogin={onLogin} errorMessage={errorMessage} />
    </div>
  );

export default LoginPage;

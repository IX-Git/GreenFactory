import React, { useState, FormEvent } from 'react';

//버튼
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button
    className={`w-full bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

//로그인 Input Field
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, ...props }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block mb-2 text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={id}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  </div>
);

// LoginForm
interface LoginFormProps {
  onLogin: (email: string, pw: string) => Promise<void>;
  errorMessage: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, errorMessage }) => {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onLogin(email, pw);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white shadow-md rounded-lg px-8 pt-8 pb-8 mb-4 max-w-md mx-auto space-y-6"
    >
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">로그인</h2>
      <InputField
        label="이메일"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        required
      />
      <InputField
        label="비밀번호"
        id="password"
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        autoComplete="current-password"
        required
      />
      {errorMessage && (
        <p className="text-red-500 text-center font-medium">{errorMessage}</p>
      )}
      <Button type="submit">로그인</Button>
    </form>
  );
};

export default LoginForm;

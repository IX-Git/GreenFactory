// components/Common/Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children, className = '', ...props
}) => (
  <button
    className={`px-4 py-2 rounded-md ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;

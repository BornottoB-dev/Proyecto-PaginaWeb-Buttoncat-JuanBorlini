import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'yellow' | 'purple' | 'cyan' | 'pink' | 'orange' | 'black' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'yellow',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const variantStyles = {
    yellow: 'bg-brand-yellow text-black hover:bg-yellow-400',
    purple: 'bg-brand-purple text-white hover:bg-purple-800',
    cyan: 'bg-brand-cyan text-black hover:bg-cyan-300',
    pink: 'bg-brand-pink text-white hover:bg-pink-600',
    orange: 'bg-brand-orange text-white hover:bg-orange-600',
    black: 'bg-black text-white hover:bg-neutral-800',
    white: 'bg-white text-black hover:bg-gray-100',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-bold',
    md: 'px-5 py-2.5 text-sm font-extrabold',
    lg: 'px-7 py-3.5 text-base font-black',
  };

  return (
    <button
      className={`
        brutal-btn
        inline-flex items-center justify-center gap-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'orange' | 'cyan' | 'pink' | 'yellow' | 'black';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'orange',
  className = '',
}) => {
  const variantStyles = {
    orange: 'bg-brand-orange text-white',
    cyan: 'bg-brand-cyan text-black',
    pink: 'bg-brand-pink text-white',
    yellow: 'bg-brand-yellow text-black',
    black: 'bg-black text-white',
  };

  return (
    <span
      className={`
        inline-block border-2 border-black font-extrabold uppercase px-2.5 py-0.5 text-xs shadow-brutal-sm transform -rotate-1
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

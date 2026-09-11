import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  bg?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  bg = 'bg-white',
  hoverEffect = true,
}) => {
  return (
    <div
      className={`
        border-3 border-black shadow-brutal
        ${bg}
        ${hoverEffect ? 'transition-transform hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className = '', id, name, 'aria-label': ariaLabel, ...props }) => {
  const fallbackId = id || name || (props.placeholder ? String(props.placeholder).toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);
  const fallbackName = name || fallbackId;
  const fallbackAria = ariaLabel || (props.placeholder ? String(props.placeholder) : undefined);

  return (
    <div className="relative w-full">
      <input
        id={fallbackId}
        name={fallbackName}
        aria-label={fallbackAria}
        className={`
          w-full border-3 border-black px-4 py-2 text-sm font-semibold text-black bg-white
          placeholder-gray-500 focus:outline-none focus:bg-yellow-50 focus:ring-2 focus:ring-black
          shadow-brutal-sm ${icon ? 'pr-10' : ''} ${className}
        `}
        {...props}
      />
      {icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black">
          {icon}
        </div>
      )}
    </div>
  );
};

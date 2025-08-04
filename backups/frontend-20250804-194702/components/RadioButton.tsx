import React from 'react';
import { motion } from 'framer-motion';

export interface RadioButtonProps {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  dotClassName?: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  dotClassName = '',
}) => {
  const generatedId = id || `radio-${name}-${value}`;

  const handleClick = () => {
    if (!disabled) {
      onChange(value);
    }
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-3 min-w-0 w-full
        ${className}
      `}
      onClick={handleClick}
    >
      <input
        type="radio"
        id={generatedId}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
      />
      
      <motion.div
        className={`
          relative flex-shrink-0 cursor-pointer
          w-5 h-5
          rounded-full border-2 border-solid
          flex items-center justify-center
          transition-all duration-200 ease-in-out
          ${checked 
            ? 'bg-purple-600 border-purple-600 shadow-purple-500/25 shadow-md' 
            : 'bg-gray-800 border-gray-600 hover:bg-gray-700 hover:border-gray-500'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-lg active:scale-95'
          }
          ${dotClassName}
        `}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        whileTap={!disabled ? { scale: 0.9 } : {}}
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!disabled) onChange(value);
          }
        }}
      >
        {checked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ 
              duration: 0.15,
              ease: "easeOut"
            }}
            className="w-2 h-2 bg-white rounded-full"
          />
        )}
      </motion.div>
      
      {label && (
        <label 
          htmlFor={generatedId} 
          className={`
            flex-1 min-w-0
            text-white text-sm font-normal 
            select-none cursor-pointer 
            leading-normal whitespace-nowrap overflow-hidden text-ellipsis
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:text-gray-200'}
          `}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default RadioButton;

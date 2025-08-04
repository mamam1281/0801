"use client";

import React, { useState } from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  id?: string;
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id,
  label,
  checked = false,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    if (disabled) return;
    const newChecked = !isChecked;
    setIsChecked(newChecked);
    onChange?.(newChecked);
  };

  React.useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`
          relative w-5 h-5 rounded border-2 cursor-pointer transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-300'}
        `}
        style={{
          borderColor: '#FCD34D', // 항상 노란색 테두리
          backgroundColor: isChecked ? '#FCD34D' : 'rgba(252, 211, 77, 0.1)', // 체크 안됐을 때도 은은한 노란색 배경
          boxShadow: isChecked 
            ? '0 0 8px rgba(252, 211, 77, 0.3)' 
            : '0 0 4px rgba(252, 211, 77, 0.1)', // 체크 안됐을 때도 은은한 glow
          minWidth: '20px', // 최소 너비 보장
          minHeight: '20px', // 최소 높이 보장
        }}
        onClick={handleChange}
      >
        {isChecked && (
          <Check 
            className="w-3 h-3 text-black absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" 
            strokeWidth={3}
          />
        )}
        <input
          id={id}
          type="checkbox"
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          aria-describedby={label ? `${id}-label` : undefined}
        />
      </div>
      {label && (
        <label
          id={`${id}-label`}
          htmlFor={id}
          className={`text-sm select-none transition-colors duration-200 ${
            disabled ? 'opacity-50 cursor-not-allowed text-neutral-400' : 'cursor-pointer text-white hover:text-amber-200'
          }`}
          onClick={handleChange}
        >
          {label}
        </label>
      )}
    </div>
  );
};
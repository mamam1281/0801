'use client';

import React, { ChangeEvent, forwardRef, ReactNode, useState } from 'react';
import { motion } from 'framer-motion';

interface InputProps {
  label?: string; // Make optional
  name?: string;  // Make optional
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: ReactNode;
  successIcon?: ReactNode;
  className?: string;
  value?: string | number;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  maxLength?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  validating?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label = "", // Default empty string
    name = "",  // Default empty string
    type = "text", 
    placeholder, 
    required, 
    error, 
    icon, 
    successIcon, 
    className,
    validating = false,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasError = !!error;
    
    return (
      <div className="w-full mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label} {required && <span className="text-pink-500">*</span>}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <motion.input
            ref={ref}
            type={type}
            id={name}
            name={name}
            placeholder={placeholder}
            required={required}
            className={`block w-full rounded-lg px-4 py-3 text-base ${
              icon ? 'pl-10' : ''
            } ${
              (validating) || successIcon ? 'pr-10' : ''
            } border ${
              hasError 
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
            } dark:bg-gray-800 dark:text-white transition duration-200 ease-in-out ${
              isFocused ? 'ring-2 ring-indigo-500/30' : ''
            }`}
            onFocus={(e) => {
              setIsFocused(true);
              if (props.onFocus) props.onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (props.onBlur) props.onBlur(e);
            }}
            {...props}
          />
          
          {validating ? (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            successIcon && !hasError && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500"
              >
                {successIcon}
              </motion.div>
            )
          )}
        </div>
        
        {hasError && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

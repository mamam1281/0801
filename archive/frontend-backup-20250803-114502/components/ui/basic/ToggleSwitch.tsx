'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ToggleSwitchProps {
  isOn: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  label?: string;
  style?: 'checkbox' | 'slider' | 'button';
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  isOn,
  onToggle,
  size = 'md',
  color = 'primary',
  disabled = false,
  label,
  style = 'checkbox'
}) => {
  const sizeConfig = {
    sm: { width: 'w-6', height: 'h-6', icon: 14 },
    md: { width: 'w-8', height: 'h-8', icon: 16 },
    lg: { width: 'w-10', height: 'h-10', icon: 20 }
  };

  const colorConfig = {
    primary: { 
      on: 'bg-purple-500 border-purple-500', 
      off: 'bg-gray-700 border-gray-600',
      hover: 'hover:border-purple-400'
    },
    success: { 
      on: 'bg-green-500 border-green-500', 
      off: 'bg-gray-700 border-gray-600',
      hover: 'hover:border-green-400'
    },
    warning: { 
      on: 'bg-yellow-500 border-yellow-500', 
      off: 'bg-gray-700 border-gray-600',
      hover: 'hover:border-yellow-400'
    },
    danger: { 
      on: 'bg-red-500 border-red-500', 
      off: 'bg-gray-700 border-gray-600',
      hover: 'hover:border-red-400'
    }
  };

  const config = sizeConfig[size];
  const colors = colorConfig[color];

  if (style === 'checkbox') {
    return (
      <div className="flex items-center gap-3">
        {label && (
          <span className="text-sm text-white font-medium">
            {label}
          </span>
        )}
        
        <motion.button
          onClick={onToggle}
          disabled={disabled}
          className={`
            ${config.width} ${config.height} 
            rounded-lg border-2 transition-all duration-300 
            flex items-center justify-center
            ${disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${colors.hover}`}
            ${isOn ? colors.on : colors.off}
          `}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          <motion.div
            initial={false}
            animate={{ 
              scale: isOn ? 1 : 0,
              rotate: isOn ? 0 : 180
            }}
            transition={{ duration: 0.2 }}
          >
            <Check size={config.icon} className="text-white" />
          </motion.div>
        </motion.button>
      </div>
    );
  }

  if (style === 'button') {
    return (
      <div className="flex items-center gap-3">
        {label && (
          <span className="text-sm text-white font-medium">
            {label}
          </span>
        )}
        
        <motion.button
          onClick={onToggle}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-xl border-2 transition-all duration-300 
            flex items-center gap-2 font-medium text-sm
            ${disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${colors.hover}`}
            ${isOn ? colors.on + ' text-white' : colors.off + ' text-gray-300'}
          `}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <motion.div
            animate={{ rotate: isOn ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            {isOn ? <Check size={14} /> : <X size={14} />}
          </motion.div>
          {isOn ? 'ON' : 'OFF'}
        </motion.button>
      </div>
    );
  }

  // 슬라이더 스타일 (기존과 다른 디자인)
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="text-sm text-white font-medium">
          {label}
        </span>
      )}
      
      <motion.button
        onClick={onToggle}
        disabled={disabled}
        className={`
          w-14 h-7 rounded-sm border-2 relative transition-all duration-300 
          ${disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${colors.hover}`}
          ${isOn ? colors.on : colors.off}
        `}
        whileHover={!disabled ? { scale: 1.05 } : {}}
      >
        <motion.div
          className="w-5 h-5 bg-white rounded-sm absolute top-0.5 shadow-lg"
          animate={{
            x: isOn ? 24 : 2
          }}
          transition={{
            type: 'spring',
            stiffness: 700,
            damping: 30
          }}
        />
        
        {/* 내부 라벨 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white/80">
            {isOn ? 'ON' : 'OFF'}
          </span>
        </div>
      </motion.button>
    </div>
  );
};

export default ToggleSwitch;

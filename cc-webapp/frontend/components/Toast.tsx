import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number; // ms. 0이면 수동 닫기
  onClose?: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  message, 
  type = 'default', 
  duration = 3000, 
  onClose 
}) => {
  // 자동 사라짐 useEffect
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [id, duration, onClose]);
  // 토스트 타입별 스타일 및 아이콘 결정
  const getStylesAndIcon = () => {
    let borderColorClass: string;
    let IconComponent: React.ElementType | null = null;

    switch (type) {
      case 'success':
        borderColorClass = 'border-[var(--color-success)]/50';
        IconComponent = CheckCircle;
        break;
      case 'error':
        borderColorClass = 'border-[var(--destructive)]/50';
        IconComponent = XCircle;
        break;
      case 'info':
        borderColorClass = 'border-[var(--color-info)]/50';
        IconComponent = Info;
        break;
      case 'warning':
        borderColorClass = 'border-[var(--color-accent-amber)]/50';
        IconComponent = AlertTriangle;
        break;
      default:
        borderColorClass = 'border-white/20';
        IconComponent = Info;
    }
    return { borderColorClass, IconComponent };
  };
  const { borderColorClass, IconComponent } = getStylesAndIcon();
  const iconSize = 20; // globals.css의 --icon-md

  const handleClick = () => {
    if (onClose) {
      onClose(id);
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose(id);
    }
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}      className={`
        max-w-xs w-full p-[var(--spacing-2)] rounded-[var(--radius-md)] shadow-lg
        flex items-center gap-[var(--spacing-2)] cursor-pointer
        backdrop-blur-xl ${borderColorClass}
        bg-gradient-to-r from-slate-800/80 to-slate-700/80 border
        relative overflow-hidden text-[var(--foreground)]
      `}
      onClick={handleClick}
      role="alert"
      aria-live="polite"
    >
      {IconComponent && <IconComponent size={iconSize} className="shrink-0" />}      <span className="flex-grow text-[13px] font-[var(--font-weight-medium)] leading-tight">
        {message}
      </span>
      {duration === 0 && (
        <button
          onClick={handleCloseClick}
          className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="토스트 닫기"
        >
          <X size={16} className="text-[var(--foreground)] opacity-70 hover:opacity-100 transition-opacity" />
        </button>
      )}
    </motion.div>
  );
};

export default Toast;

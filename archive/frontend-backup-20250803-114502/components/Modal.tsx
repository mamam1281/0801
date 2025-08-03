import React, { useEffect, useRef, KeyboardEvent, useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'ice';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  size?: ModalSize;
  variant?: ModalVariant;
  className?: string;
  backdropClassName?: string;
  showCloseButton?: boolean;
  allowSwipeClose?: boolean;
}

// 모달 크기별 클래스 - CSS Variables 완전 준수
const sizeClassMap: Record<ModalSize, string> = {
  sm: 'w-full max-w-full md:max-w-modal-sm',
  md: 'w-full max-w-full md:max-w-modal-md',
  lg: 'w-full max-w-full md:max-w-modal-lg',
  xl: 'w-full max-w-full md:max-w-modal-xl',
  full: 'w-full h-full max-w-full max-h-full',
};

// 모달 배경 효과별 클래스
const variantClassMap: Record<ModalVariant, string> = {
  default: 'bg-card/80 border border-border/10 backdrop-filter backdrop-blur-[24px] backdrop-saturate-[200%] shadow-[0_16px_40px_rgba(var(--black-rgb),0.4),inset_0_1px_0_rgba(var(--pure-white-rgb),0.15),0_0_80px_rgba(var(--black-rgb),0.1)]',
  ice: 'modal-ice-glass',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  description,
  size = 'md',
  variant = 'default',
  className = '',
  backdropClassName = '',
  showCloseButton = true,
  allowSwipeClose = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const [dragY, setDragY] = useState(0);

  // 모바일 감지
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767;

  // 포커스 가능한 요소 찾기
  const getFocusableElements = () => {
    if (!modalRef.current) return [];
    return Array.from(
      modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled'));
  };

  // 포커스 트랩 및 body 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      lastActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        const focusables = getFocusableElements();
        if (focusables.length) focusables[0].focus();
        else modalRef.current?.focus();
      }, 10);
    } else {
      document.body.style.overflow = '';
      lastActiveElement.current?.focus();
    }
    return () => {
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line
  }, [isOpen]);

  // ESC 키 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // 포커스 트랩
      if (e.key === 'Tab') {
        const focusables = getFocusableElements();
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown as any);
    return () => document.removeEventListener('keydown', handleKeyDown as any);
    // eslint-disable-next-line
  }, [isOpen, onClose]);
  // 오버레이 클릭 시 닫기
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  // 스와이프 제스처 처리 (모바일)
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!allowSwipeClose || !isMobile) return;
    
    // 아래쪽으로 100px 이상 드래그하면 닫기
    if (info.offset.y > 100 && info.velocity.y > 0) {
      onClose();
    }
    setDragY(0);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (!allowSwipeClose || !isMobile) return;
    
    // 위쪽으로 드래그는 제한
    const newY = Math.max(0, info.offset.y);
    setDragY(newY);
  };

  // CSS Variables 준수 애니메이션 variants
  const backdropVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const modalVariants = {
    initial: isMobile 
      ? { y: '100%', opacity: 0.8 }
      : { scale: 0.96, opacity: 0, y: 40 },
    animate: isMobile
      ? { y: 0, opacity: 1 }
      : { scale: 1, opacity: 1, y: 0 },
    exit: isMobile
      ? { y: '100%', opacity: 0.8 }
      : { scale: 0.96, opacity: 0, y: 40 },
  };
  return (
    <AnimatePresence>
      {isOpen && (        <motion.div          className={`
            fixed inset-0 z-50 flex items-end md:items-center justify-center 
            modal-overlay-ice-glass
            ${backdropClassName}
          `}
          variants={backdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: Number(getComputedStyle(document.documentElement).getPropertyValue('--transition-normal').replace('ms', '')) / 1000 || 0.2 }}
          onClick={handleBackdropClick}
          aria-modal="true"
          tabIndex={-1}
        >          <motion.div
            ref={modalRef}            className={`
              ${isMobile 
                ? 'w-full h-auto min-h-[50vh] max-h-[90vh] rounded-t-xl rounded-b-none' 
                : `${sizeClassMap[size]} rounded-lg`
              }
              ${variantClassMap[variant]}
              p-6 relative flex flex-col focus:outline-none overflow-hidden
              ${className}
            `}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-desc' : undefined}
            tabIndex={-1}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              type: "tween", 
              duration: Number(getComputedStyle(document.documentElement).getPropertyValue('--transition-normal').replace('ms', '')) / 1000 || 0.2,
              ease: [0.4, 0, 0.2, 1]
            }}
            drag={isMobile && allowSwipeClose ? "y" : false}
            dragConstraints={{ top: 0, bottom: window.innerHeight }}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{
              y: dragY,
            }}
          >            {/* 모바일용 스와이프 인디케이터 */}
            {isMobile && allowSwipeClose && (
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-5 h-0.5 bg-muted-foreground/20 rounded-full backdrop-blur-sm"></div>
                {/* w-5 maps to var(--spacing-5) -> 40px */}
                {/* h-0.5 maps to var(--spacing-0-5) -> 4px */}
              </div>
            )}

            {showCloseButton && (
              <Button
                iconOnly
                variant="text"
                size="md"
                aria-label="Close"
                className="absolute top-3 right-3 z-10"
                onClick={onClose}
              >
                <X size={20} />
              </Button>
            )}

            {/* 모달 헤더 */}
            {title && (
              <div className="modal-header-ice-glass p-6 -m-6 mb-4">
                <h2 
                  id="modal-title" 
                  className={`
                    text-h3 font-semibold 
                    text-white
                    leading-heading
                    ${isMobile ? 'mt-3' : ''}
                  `}
                >
                  {title}
                </h2>
                
                {description && (
                  <p 
                    id="modal-desc" 
                    className="
                      text-caption mt-2
                      text-white/70 leading-body
                    "
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
            
            {!title && description && (
              <p 
                id="modal-desc" 
                className="
                  text-caption mb-4 
                  text-white/70 leading-body
                "
              >
                {description}
              </p>
            )}
            
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

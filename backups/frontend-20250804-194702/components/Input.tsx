import React, { useState, useRef } from 'react';
import { LucideIcon, Eye, EyeOff, Search, User, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type InputVariant = 'default' | 'search' | 'email' | 'password' | 'text' | 'gradient';
export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'focused' | 'error' | 'disabled' | 'success';

export interface InputProps {
  variant?: InputVariant;
  size?: InputSize;
  state?: InputState;
  label?: string;
  error?: string; // Original error prop
  success?: string; // Original success prop
  errorMessage?: string; // For Storybook and explicit error messaging
  successMessage?: string; // For Storybook and explicit success messaging
  disabled?: boolean;
  leftIcon?: React.ReactNode; // Allow custom ReactNode for left icon
  rightIcon?: React.ReactNode; // Allow custom ReactNode for right icon
  showPasswordToggle?: boolean;
  fullWidth?: boolean;
  className?: string; // Additional classes for the input element itself
  containerClassName?: string; // Classes for the outer div container
  type?: "text" | "password" | "email" | "search"; // Removed 'gradient' as it's a style variant
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  // Allow all other standard input attributes
  [key: string]: any;
}

const sizeConfig = {
  sm: {
    height: 'h-input-sm',
    font: 'text-caption',
    iconSize: 16,
    py: 'py-1.5',
    pxDefault: 'px-2',
    plIcon: 'pl-7',
    prIcon: 'pr-7',
    iconLeftPos: 'left-2',
    iconRightPos: 'right-2',
    labelGap: 'mb-1',
  },
  md: {
    height: 'h-input-md',
    font: 'text-body',
    iconSize: 20,
    py: 'py-2',
    pxDefault: 'px-3',
    plIcon: 'pl-9',
    prIcon: 'pr-9',
    iconLeftPos: 'left-3',
    iconRightPos: 'right-3',
    labelGap: 'mb-2',
  },
  lg: {
    height: 'h-input-lg',
    font: 'text-h5',
    iconSize: 24,
    py: 'py-2.5',
    pxDefault: 'px-4',
    plIcon: 'pl-11',
    prIcon: 'pr-11',
    iconLeftPos: 'left-4',
    iconRightPos: 'right-4',
    labelGap: 'mb-2',
  },
};

export const Input = ({
  variant = 'default',
  size = 'md',
  state: propState = 'default',
  label,
  error,
  success,
  errorMessage,
  successMessage,
  disabled = false,
  leftIcon: customLeftIcon,
  rightIcon: customRightIcon,
  showPasswordToggle = false,
  fullWidth = false,
  className = '',
  containerClassName = '',
  type = 'text',
  id,
  value,
  defaultValue,
  onChange,
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value ?? defaultValue ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSize = sizeConfig[size];
  const actualPasswordToggleIconSize = currentSize.iconSize;

  React.useEffect(() => {
    if (value !== undefined) setInputValue(value);
  }, [value]);

  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  const determinedError = error || errorMessage;
  const determinedSuccess = success || successMessage;

  const currentState: InputState = disabled
    ? 'disabled'
    : determinedError
    ? 'error'
    : determinedSuccess
    ? 'success'
    : propState;

  const defaultIconElement = (() => {
    const iconColorClass = `text-neutral-medium ${isFocused || inputValue ? 'group-focus-within:text-text-secondary' : 'group-hover:text-text-secondary'}`;
    if (variant === 'search') return <Search size={currentSize.iconSize} className={iconColorClass} />;
    if (variant === 'email' && type === 'email') return <Mail size={currentSize.iconSize} className={iconColorClass} />;
    if (variant === 'password' && type === 'password' && !showPasswordToggle) return <Lock size={currentSize.iconSize} className={iconColorClass} />;
    return null;
  })();

  const actualLeftIcon = customLeftIcon || defaultIconElement;

  const passwordToggleAndRightIconElement = (() => {
    if (isPasswordType && showPasswordToggle) {
      return (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={`flex items-center justify-center p-1 rounded-full text-neutral-medium hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors duration-normal w-[${actualPasswordToggleIconSize + 8}px] h-[${actualPasswordToggleIconSize + 8}px]`}
          tabIndex={-1}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={actualPasswordToggleIconSize} /> : <Eye size={actualPasswordToggleIconSize} />}
        </button>
      );
    }
    return customRightIcon;
  })();

  const getFinalPaddingClasses = (hasLeft: boolean, hasRight: boolean) => {
    const { py, pxDefault, plIcon, prIcon } = currentSize;
    let pl = hasLeft ? plIcon : pxDefault.replace('px-', 'pl-');
    let pr = hasRight ? prIcon : pxDefault.replace('px-', 'pr-');

    if (!hasLeft && !hasRight) return `${py} ${pxDefault}`;
    return `${py} ${pl} ${pr}`;
  };

  const inputPaddingClasses = getFinalPaddingClasses(!!actualLeftIcon, !!passwordToggleAndRightIconElement);

  const getBaseVariantStyles = () => {
    const baseClasses = [
      'w-full',
      currentSize.height,
      currentSize.font,
      'transition-[border-color,box-shadow,background-color] duration-normal ease-out',
      'placeholder:text-muted-foreground placeholder:transition-opacity placeholder:duration-normal',
      'text-foreground',
      'rounded-md',
    ];

    const stateSpecificStyles = {
      default: 'border-border',
      focused: 'border-ring shadow-focused-glow',
      error: 'border-destructive bg-destructive/10 shadow-error-glow',
      success: 'border-success bg-success/10 shadow-success-glow',
      disabled: 'border-border/50 bg-input/50 text-muted-foreground cursor-not-allowed',
    };

    if (currentState === 'disabled') {
      return [...baseClasses, stateSpecificStyles.disabled].join(' ');
    }

    let variantStyles: string[] = [...baseClasses];

    if (variant === 'gradient' || (variant === 'default' && (type === 'email' || type === 'password'))) { // Apply gradient style to email/password types by default
      variantStyles.push(
        'bg-transparent border-0 border-b-2',
        currentState === 'focused' ? 'border-b-transparent'
        : currentState === 'error' ? 'border-b-destructive'
        : currentState === 'success' ? 'border-b-success'
        : 'border-b-border'
      );
    } else { // search, text, or default variant not matching email/password type
      variantStyles.push('bg-input border-2 shadow-inner-sm', stateSpecificStyles[currentState]);
    }
    return variantStyles.join(' ');
  };

  const finalInputClassName = [
    getBaseVariantStyles(),
    inputPaddingClasses,
    className,
  ].filter(Boolean).join(' ');

  const renderGradientUnderline = () => {
    if (!((variant === 'gradient' || (variant === 'default' && (type === 'email' || type === 'password'))) && currentState !== 'disabled')) return null;
    return (
      <AnimatePresence>
        {isFocused && (
          <motion.div
            layout
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-0 bottom-0 w-full h-0.5 bg-gradient-purple-primary origin-left"
          />
        )}
      </AnimatePresence>
    );
  };

  const renderLabel = () =>
    label ? (
      <motion.label
        htmlFor={id}
        initial={false}
        animate={{ color: isFocused ? 'var(--primary)' : 'var(--muted-foreground)' }}
        transition={{ duration: 0.2 }}
        className={`block ${currentSize.labelGap} text-body select-none`}
      >
        {label}
      </motion.label>
    ) : null;

  const renderMessage = () => {
    const messageText = determinedError || determinedSuccess;
    const messageColor = determinedError ? 'text-error' : 'text-success';

    if (messageText) {
      return (
        <motion.p
          key={messageText}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={`mt-1.5 text-caption ${messageColor}`}
        >
          {messageText}
        </motion.p>
      );
    }
    if (type === 'password' && variant === 'password' && !determinedError && !determinedSuccess) {
      return (
        <motion.p
          key="forgot-password"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mt-1.5 text-caption text-text-secondary cursor-pointer select-none hover:text-primary transition-colors"
        >
          Forgot Password?
        </motion.p>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'w-80'} ${containerClassName} group`}>
      {renderLabel()}
      <div className="relative flex items-center">
        {actualLeftIcon && (
          <span className={`absolute ${currentSize.iconLeftPos} top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center`}>
            {actualLeftIcon}
          </span>
        )}
        <motion.input
          ref={inputRef}
          id={id}
          type={inputType}
          className={finalInputClassName}
          disabled={disabled}
          value={inputValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={e => {
            setInputValue(e.target.value);
            onChange?.(e);
          }}
          {...props}
        />
        {passwordToggleAndRightIconElement && (
          <span className={`absolute ${currentSize.iconRightPos} top-1/2 -translate-y-1/2 z-10 flex items-center justify-center`}>
            {passwordToggleAndRightIconElement}
          </span>
        )}
        {renderGradientUnderline()}
      </div>
      <AnimatePresence mode="wait">
        {renderMessage()}
      </AnimatePresence>
    </div>
  );
};

Input.displayName = 'Input';

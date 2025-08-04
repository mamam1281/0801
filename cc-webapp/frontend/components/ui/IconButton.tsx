import React from "react";
import { motion } from "framer-motion";

const sizeClasses = {
  sm: "w-8 h-8 p-1",
  md: "w-10 h-10 p-2",
  lg: "w-12 h-12 p-3"
};

const variantClasses = {
  default: "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white",
  primary: "bg-purple-600 hover:bg-purple-700 text-white",
  secondary: "bg-gray-600 hover:bg-gray-500 text-white"
};

interface IconButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: keyof typeof sizeClasses;
  variant?: keyof typeof variantClasses;
  onClick?: () => void;
  disabled?: boolean;
}

export default function IconButton({
  children,
  onClick,
  className = "",
  size = "md",
  variant = "default",
  disabled = false
}: IconButtonProps) {
  const baseClasses = "rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900";
  const sizeClass = sizeClasses[size];
  const variantClass = variantClasses[variant];
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  const combinedClassName = `${baseClasses} ${sizeClass} ${variantClass} ${disabledClass} ${className}`.trim();
  
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={combinedClassName}
    >
      {children}
    </motion.button>
  );
}

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
}

export default function GlowCard({ 
  children, 
  className = "", 
  glowColor = "from-pink-500 to-purple-600", 
  onClick 
}: GlowCardProps) {
  return (
    <div className="relative group">
      <motion.div
        className={`absolute inset-0 rounded-xl bg-gradient-to-r opacity-75 blur-lg group-hover:opacity-100 transition-opacity ${glowColor}`}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ 
          repeat: Infinity, 
          duration: 3,
          ease: "easeInOut" 
        }}
      />
      <div 
        className={`relative rounded-xl bg-gray-800/95 backdrop-blur-sm border border-gray-700 overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    </div>
  );
}

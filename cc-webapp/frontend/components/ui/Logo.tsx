import React from "react";
import { motion } from "framer-motion";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  className?: string;
}

export default function Logo({ size = "md", glow = false, className = "" }: LogoProps) {
  const sizeMap = { sm: 32, md: 48, lg: 64, xl: 80 };
  const px = sizeMap[size] || 48;
  
  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
      whileHover={{ scale: 1.05 }}
    >
      {glow && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-full blur-lg opacity-75"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
      <div className="relative z-10 w-full h-full bg-gradient-to-br from-pink-500 via-purple-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
        {/* Temporary logo - replace with actual logo image */}
        <div className="text-xl">🎰</div>
      </div>
    </motion.div>
  );
}

import { motion } from "framer-motion";
import clsx from "clsx";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8"
};

export default function Loading({ size = "md", color = "border-white", className }: LoadingProps) {
  return (
    <motion.div
      className={clsx(
        "rounded-full border-2 border-t-transparent animate-spin",
        sizeClasses[size],
        color,
        className
      )}
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

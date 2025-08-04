import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface QuickAccessCardProps {
  id: number;
  title: string;
  icon: string;
  bonus?: string;
  onClick?: () => void;
}

export default function QuickAccessCard({ 
  id, 
  title, 
  icon, 
  bonus, 
  onClick 
}: QuickAccessCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative min-w-[120px] cursor-pointer"
    >
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 shadow-lg hover:shadow-purple-500/20 transition-all border border-gray-700 hover:border-purple-500/50">
        {/* Icon */}
        <div className="text-3xl mb-2 text-center">
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-white text-sm font-medium text-center mb-1">
          {title}
        </h3>
        
        {/* Bonus */}
        {bonus && (
          <div className="text-xs text-center">
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent font-bold">
              {bonus}
            </span>
          </div>
        )}
        
        {/* Arrow indicator */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 hover:opacity-100 transition-opacity -z-10 blur-lg" />
      </div>
    </motion.div>
  );
}

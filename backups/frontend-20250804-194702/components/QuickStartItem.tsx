import React from 'react';
import { motion } from 'framer-motion';

export interface QuickStartItemProps {
  id: string;
  label: string;
  iconBgColor: string;
  iconPlaceholder: string;
  onClick?: () => void;
}

export const QuickStartItem: React.FC<QuickStartItemProps> = ({
  label,
  iconBgColor,
  iconPlaceholder,
  onClick,
}) => (
  <motion.div
    className="group cursor-pointer"
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    onClick={onClick}
  >
    <div
      className="relative rounded-2xl p-4 border border-white/10 transition-all duration-300"
      style={{
        height: '200px',
        maxHeight: '200px',
        minWidth: '120px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.05)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 100%)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(31, 38, 135, 0.3), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.2), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.05)';
      }}
    >
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <motion.div
          className="flex items-center justify-center rounded-lg shadow-lg border border-white/20"
          style={{
            background: `linear-gradient(135deg, ${iconBgColor}88, ${iconBgColor}44)`,
            width: '52px',
            height: '52px',
            fontSize: '26px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
          whileHover={{ rotate: 2, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
        >
          {iconPlaceholder}
        </motion.div>
        <span className="text-center font-semibold transition-colors duration-300" style={{ 
          fontSize: '15px', 
          lineHeight: '1.2',
          color: 'rgba(255,255,255,0.95)',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}>
          {label}
        </span>
      </div>
    </div>
  </motion.div>
);

export default QuickStartItem;

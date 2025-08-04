import React from 'react';
import { motion } from 'framer-motion';

export interface GameCardProps {
  id: string;
  title: string;
  rating: number;
  players: string;
  imageUrl?: string;
  imagePlaceholder: string;
  onClick?: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  title,
  rating,
  players,
  imageUrl,
  imagePlaceholder,
  onClick,
}) => (
  <motion.div 
    className="cursor-pointer w-full group"
    onClick={onClick}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    tabIndex={0}
    role="button"
    aria-label={title}
  >
    <div 
      className="relative rounded-2xl p-4 border border-white/10 transition-all duration-300"
      style={{ 
        height: '200px',
        maxHeight: '200px',
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
      <div className="w-full h-full flex flex-col items-center justify-center" style={{ gap: '12px' }}>
        
        {/* 이미지 영역 - 균형 잡힌 크기 */}
        <div className="flex-shrink-0 flex items-center justify-center">
          {imageUrl ? (
            <motion.img 
              src={imageUrl} 
              alt={title} 
              className="object-cover rounded-lg shadow-lg border border-white/20" 
              style={{ width: '52px', height: '52px' }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
            />
          ) : (
            <motion.div 
              className="flex items-center justify-center rounded-lg shadow-lg border border-white/20"
              style={{ 
                width: '52px', 
                height: '52px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(79, 70, 229, 0.2) 100%)',
                fontSize: '26px'
              }}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
            >
              <span className="text-purple-200 font-bold">
                {imagePlaceholder}
              </span>
            </motion.div>
          )}
        </div>
        
        {/* 텍스트 정보 영역 - 가독성 향상 */}
        <div className="text-center flex-shrink-0 w-full" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 className="font-bold leading-tight px-1 transition-colors duration-300" style={{ 
            fontSize: '16px', 
            lineHeight: '1.2',
            color: 'rgba(255,255,255,0.95)',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}>
            {title}
          </h3>
          <div className="flex items-center justify-center gap-2" style={{ fontSize: '13px' }}>
            <span className="flex items-center gap-1 font-semibold" style={{ 
              color: 'rgba(251, 191, 36, 0.95)',
              fontWeight: '600'
            }}>
              ⭐️ {rating}
            </span>
            <span style={{ color: 'rgba(196, 181, 253, 0.7)', fontSize: '12px' }}>•</span>
            <span className="font-medium" style={{ 
              color: 'rgba(229, 231, 235, 0.85)',
              fontWeight: '500'
            }}>
              {players}
            </span>
          </div>
        </div>
        
      </div>
    </div>
  </motion.div>
);

export default GameCard;

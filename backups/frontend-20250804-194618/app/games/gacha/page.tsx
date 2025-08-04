'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { openGamePopup } from '../../../utils/gamePopup';

function GachaMainContent() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleOpenPopup = () => {
    const popup = openGamePopup('gacha');
    if (popup) {
      setIsPopupOpen(true);
      
      const checkPopupClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopupClosed);
          setIsPopupOpen(false);
        }
      }, 500);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)] via-[var(--color-primary-charcoal)] 
    to-[var(--color-primary-dark-navy)] min-h-screen flex flex-col items-center">
      <motion.header
        className="z-20 py-3 sm:py-4 px-4 sm:px-6 w-full bg-gradient-to-br from-[var(--color-primary-dark-navy)]/80 via-[var(--color-primary-charcoal)]/80 to-[var(--color-primary-dark-navy)]/80 backdrop-blur-md border-b border-[var(--border)]/20"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-2">
          <motion.h1
            className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-[var(--color-accent-cyan)] 
            via-[var(--color-accent-blue)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent text-center tracking-wide"
            whileHover={{ scale: 1.02 }}
          >
            랜덤 뽑기
          </motion.h1>
        </div>
      </motion.header>

      <div className="flex-1 w-full flex flex-col items-center justify-center p-4">
        <motion.div
          className="glass-card p-6 max-w-md w-full text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={handleOpenPopup}
            disabled={isPopupOpen}
            className={`btn-primary-glow w-full py-4 rounded-lg text-xl font-medium transition-all ${
              isPopupOpen ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            {isPopupOpen ? '게임 진행 중...' : '랜덤 뽑기 시작'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function GachaPage() {
  return <GachaMainContent />;
}

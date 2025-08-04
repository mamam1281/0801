'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function ResponsiveLearningPage() {
  return (
    <div className="miniapp-container min-h-screen bg-gradient-to-br from-[var(--color-background-primary)] to-[var(--color-background-secondary)]">
      {/* Header */}
      <motion.header 
        className="bg-[var(--color-surface-primary)]/80 backdrop-blur-md shadow-md border-b border-[var(--color-border-primary)]"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="miniapp-header px-4 py-6">
          <div className="text-center">
            <motion.h1 
              className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-2"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              📚 반응형 학습
            </motion.h1>
            <motion.p 
              className="text-[var(--color-text-secondary)] text-sm sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              학습 내용이 여기에 표시됩니다
            </motion.p>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 miniapp-content py-6 sm:py-8">
        <motion.div
          className="flex items-center justify-center min-h-[60vh]"
          initial={{ scale: 0.9, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
        >
          <div className="bg-[var(--color-surface-secondary)]/80 backdrop-blur-sm rounded-xl p-8 border border-[var(--color-border-secondary)] text-center">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              학습 콘텐츠 준비 중
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              곧 흥미로운 학습 콘텐츠로 업데이트될 예정입니다.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GachaResult, TIER_COLORS } from './types';
import './gacha-premium-theme.css';

interface GachaModalProps {
  isOpen: boolean;
  result: GachaResult | null;
  onClose: () => void;
}

export function GachaModal({ isOpen, result, onClose }: GachaModalProps) {
  if (!result) return null;

  const tierColor = TIER_COLORS[result.item.tier];
  const tierClassName = `tier-${result.item.tier}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="gacha-modal-backdrop"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="gacha-modal-container">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              className={`gacha-modal ${tierClassName}`}
            >
              {/* Tier Badge */}
              <div className={`gacha-tier-badge ${tierClassName}`}>
                {tierColor.name}
              </div>

              {/* Item Display */}
              <div className="gacha-item-icon">
                {result.item.emoji}
              </div>

              {/* New Badge */}
              {result.isNew && (
                <div className="gacha-new-badge">
                  NEW!
                </div>
              )}

              {/* Item Info */}
              <div className="mb-6">
                <h3 className="gacha-item-name" style={{ color: tierColor.color }}>
                  {result.item.name}
                </h3>
                <p className="gacha-item-description" style={{ color: tierColor.color }}>
                  {result.item.description}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className={`gacha-modal-button ${tierClassName}`}
              >
                확인
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

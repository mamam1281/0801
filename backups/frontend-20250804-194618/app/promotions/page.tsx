'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Star, 
  Zap, 
  TrendingUp, 
  Gift, 
  Target, 
  Sparkles,
  Trophy,
  Coins,
  Play,
  ArrowLeft,
  Crown,
  Flame,
  Percent,
  Calendar,
  Users
} from 'lucide-react';
import PromotionContainer from '../../components/promotion/PromotionContainer';

export default function PromotionsPage() {
  useEffect(() => {
    document.title = '🎁 프로모션 - COSMIC CASINO';
  }, []);

  return <PromotionContainer />;
}

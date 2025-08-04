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
import RewardContainer from '../../components/reward/RewardContainer';

export default function RewardsPage() {
  useEffect(() => {
    document.title = '🏆 리워드 센터 - COSMIC CASINO';
  }, []);

  return <RewardContainer />;
}

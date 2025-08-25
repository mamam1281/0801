'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  Star,
  Crown,
  Gem,
  Gift,
  Sparkles,
  ShoppingCart,
  Coins,
  Zap,
  Trophy,
  Shield,
  Tag,
  Timer,
  Flame
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { User, GameItem } from '../types';
import useBalanceSync from '@/hooks/useBalanceSync';
import { api } from '@/lib/unifiedApi';
import { useWithReconcile } from '@/lib/sync';
import { useGlobalProfile } from '@/store/globalStore';
import { useGameConfig } from '@/hooks/useGameConfig';

interface ShopScreenProps {
  user: User;
  onBack: () => void;
  onNavigateToInventory: () => void;
  onNavigateToProfile: () => void;
  onUpdateUser: (user: User) => void;
  onAddNotification: (message: string) => void;
}

// 서버 카탈로그(useGameConfig.shop) 사용. 하드코딩된 상점 아이템은 제거되었습니다.

export function ShopScreen({
  user,
  onBack,
  onNavigateToInventory,
  onNavigateToProfile,
  onUpdateUser,
  onAddNotification
}: ShopScreenProps) {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null as import('../types').GameItem | null);
  const { reconcileBalance } = useBalanceSync({ sharedUser: user, onUpdateUser, onAddNotification });
  const withReconcile = useWithReconcile();
  const profile = useGlobalProfile();
  const { config: gameConfig } = useGameConfig();

  // 마운트 시 1회 권위 잔액으로 정합화
  useEffect(() => {
    reconcileBalance().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🎨 등급별 스타일링 (글래스메탈 버전)
  const getRarityStyles = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return {
          textColor: 'text-muted-foreground',
          borderColor: 'border-muted-foreground/30',
          bgColor: 'bg-secondary/20',
          glowColor: 'hover:shadow-lg'
        };
      case 'rare':
        return {
          textColor: 'text-info',
          borderColor: 'border-info/30',
          bgColor: 'bg-info/10',
          glowColor: 'hover:shadow-info/20 hover:shadow-lg'
        };
      case 'epic':
        return {
          textColor: 'text-primary',
          borderColor: 'border-primary/30',
          bgColor: 'bg-primary/10',
          glowColor: 'hover:shadow-primary/20 hover:shadow-lg'
        };
      case 'legendary':
        return {
          textColor: 'text-gold',
          borderColor: 'border-gold/30',
          bgColor: 'bg-gold/10',
          glowColor: 'hover:shadow-gold/20 hover:shadow-lg'
        };
      default:
        return {
          textColor: 'text-muted-foreground',
          borderColor: 'border-muted-foreground/30',
          bgColor: 'bg-secondary/20',
          glowColor: 'hover:shadow-lg'
        };
    }
  };

  // 💰 아이템 구매 처리
  const handlePurchase = async (item: any) => {
    const discount = Number(item.discount_percent ?? 0);
    const baseGold = Number(item.gold ?? 0);
    const finalGold = Math.max(0, Math.floor(baseGold * (100 - discount) / 100));
    const currentGold = Number((profile as any)?.goldBalance ?? user.goldBalance ?? 0);

    if (currentGold < finalGold) {
      onAddNotification('❌ 골드가 부족합니다!');
      return;
    }

    try {
      // OpenAPI에 따르면 product_id는 문자열이며, 카탈로그의 sku를 사용합니다.
      const productId = (item.sku ?? item.id ?? '').toString();
      await withReconcile(async (idemKey: string) =>
        api.post('shop/buy', { product_id: productId, quantity: 1 }, { headers: { 'X-Idempotency-Key': idemKey } })
      );
      onAddNotification(`✅ ${item.name}을(를) 구매했습니다!`);
    } catch (e) {
      // 실패 시에도 최종적으로 권위 잔액과 동기화 시도
      onAddNotification('구매 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
    // 구매 후 권위 잔액 재조회로 최종 정합 유지
    try { await reconcileBalance(); } catch {}
    setShowPurchaseModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-black to-primary/5 relative overflow-hidden">
      {/* 🌟 고급 배경 효과 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: 0,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)
            }}
            animate={{ 
              opacity: [0, 0.4, 0],
              scale: [0, 2, 0],
              rotate: 360
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
            className="absolute w-1.5 h-1.5 bg-gradient-to-r from-primary/40 to-gold/40 rounded-full"
          />
        ))}
      </div>

      {/* 🔮 글래스메탈 헤더 - 간소화 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-4 lg:p-6 border-b border-border-secondary/50 glass-metal"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="glass-metal-hover hover:bg-primary/10 transition-all duration-300 border-metal"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로가기
            </Button>
            
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gradient-metal">
                💎 프리미엄 상점
              </h1>
              <p className="text-sm text-muted-foreground">특별한 아이템과 보너스를 만나보세요</p>
            </div>
          </div>

          <div className="glass-metal rounded-xl p-4 border-metal metal-pulse">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">보유 골드</div>
              <div className="text-xl font-black text-gradient-gold">
                {Number((profile as any)?.goldBalance ?? user.goldBalance ?? 0).toLocaleString()}G
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 메인 콘텐츠 */}
      <div className="relative z-10 p-4 lg:p-6 max-w-7xl mx-auto">
        {/* 🎯 빠른 액션 버튼들 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onNavigateToInventory}
              className="glass-metal-hover bg-gradient-to-r from-success to-primary text-white border-0 px-8 py-3 metal-shine"
            >
              <Package className="w-5 h-5 mr-2" />
              내 아이템 보기
            </Button>
            <Button
              onClick={onNavigateToProfile}
              className="glass-metal-hover bg-gradient-to-r from-info to-primary text-white border-0 px-8 py-3 metal-shine"
            >
              <Trophy className="w-5 h-5 mr-2" />
              프로필 관리
            </Button>
          </div>
        </motion.div>

        {/* 🎯 보유 아이템 미리보기 (글래스메탈) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="glass-metal p-8 border-success/20 metal-shine">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-success to-primary p-3 glass-metal">
                  <Package className="w-full h-full text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gradient-metal">✨ 보유 아이템 미리보기</h3>
                  <p className="text-muted-foreground">현재 소유하고 있는 프리미엄 아이템들</p>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={onNavigateToInventory}
                className="glass-metal-hover border-success/30 text-success hover:bg-success/10 metal-shine"
              >
                <Package className="w-4 h-4 mr-2" />
                전체 보기
              </Button>
            </div>

            {user.inventory.length === 0 ? (
              <div className="text-center py-12">
                <div className="glass-metal rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <p className="text-lg text-muted-foreground mb-2">보유한 아이템이 없습니다</p>
                <p className="text-muted-foreground">아래에서 프리미엄 아이템을 구매해보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {user.inventory.slice(0, 16).map((item, index) => {
                  const styles = getRarityStyles(item.rarity);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`glass-metal-hover ${styles.bgColor} rounded-xl p-4 border-2 ${styles.borderColor} text-center metal-shine`}
                    >
                      <div className="text-3xl mb-3">{item.icon}</div>
                      <div className={`text-xs font-bold ${styles.textColor} mb-2 truncate`}>
                        {item.name}
                      </div>
                      {item.quantity > 1 && (
                        <Badge variant="secondary" className="text-xs glass-metal text-white">
                          ×{item.quantity}
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
                
                {user.inventory.length > 16 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={onNavigateToInventory}
                    className="glass-metal-hover bg-muted/20 rounded-xl p-4 border-2 border-dashed border-muted cursor-pointer hover:border-primary transition-colors text-center metal-shine"
                  >
                    <div className="text-3xl mb-3">📦</div>
                    <div className="text-xs font-bold text-muted-foreground mb-2">
                      더보기
                    </div>
                    <div className="text-xs text-primary">
                      +{user.inventory.length - 16}개
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* 🛍️ 상점 아이템 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gradient-primary mb-2">🛍️ 프리미엄 아이템 상점</h2>
            <p className="text-muted-foreground">특별한 아이템으로 게임을 더욱 즐겁게!</p>
          </div>
        </motion.div>

        {/* 🛍️ 상점 아이템 그리드 (글래스메탈) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {(gameConfig?.shop ?? []).map((item: any, index: number) => {
            // 서버 카탈로그 스키마: { id, name, gold, discount_percent, min_rank, ... }
            const rarity = (item.min_rank ? 'rare' : 'common') as 'common' | 'rare' | 'epic' | 'legendary';
            const discount = Number(item.discount_percent ?? 0);
            const baseGold = Number(item.gold ?? 0);
            const finalGold = Math.max(0, Math.floor(baseGold * (100 - discount) / 100));
            const currentGold = Number((profile as any)?.goldBalance ?? user.goldBalance ?? 0);
            const canAfford = currentGold >= finalGold;
            const styles = getRarityStyles(rarity);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                <Card className={`glass-metal p-8 border-2 ${styles.borderColor} glass-metal-hover ${styles.glowColor} relative overflow-hidden metal-shine`}>
                  {/* 🏷️ 배지들 */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
          {discount > 0 && (
                      <Badge className="glass-metal bg-error text-white font-bold text-xs px-3 py-2 rounded-full">
            -{discount}%
                      </Badge>
                    )}
          {item.isLimited && (
                      <Badge className="glass-metal bg-gold text-white font-bold text-xs px-3 py-2 rounded-full">
                        <Timer className="w-3 h-3 mr-1" />
                        한정
                      </Badge>
                    )}
                  </div>

                  {item.popular && (
                    <div className="absolute top-4 left-4">
                      <Badge className="glass-metal bg-primary text-white font-bold text-xs px-3 py-2 rounded-full">
                        <Flame className="w-3 h-3 mr-1" />
                        인기
                      </Badge>
                    </div>
                  )}

                  {/* 🎨 아이템 아이콘 */}
                  <div className={`glass-metal ${styles.bgColor} rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center text-4xl border ${styles.borderColor} metal-shine`}>
                    {/* 서버 아이템에는 아이콘이 없을 수 있어 기본 이모지 */}
                    {item.icon ?? '🛒'}
                  </div>

                  {/* 📝 아이템 정보 */}
                  <div className="text-center mb-6">
                    <h3 className={`text-lg font-bold ${styles.textColor} mb-3`}>
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                    
                    <Badge className={`glass-metal text-white border ${styles.borderColor} bg-transparent px-3 py-1`}>
                      {rarity === 'common' ? '일반' :
                       rarity === 'rare' ? '레어' :
                       rarity === 'epic' ? '에픽' : '전설'}
                    </Badge>
                  </div>

                  {/* 💰 가격 및 구매 */}
                  <div className="space-y-4">
                    <div className="text-center">
                      {discount > 0 ? (
                        <div>
                          <div className="text-sm text-muted-foreground line-through mb-1">
                            {baseGold.toLocaleString()}G
                          </div>
                          <div className="text-2xl font-bold text-error">
                            {finalGold.toLocaleString()}G
                          </div>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gradient-gold">
                          {baseGold.toLocaleString()}G
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowPurchaseModal(true);
                      }}
                      disabled={!canAfford}
                      className={`w-full glass-metal-hover ${
                        rarity === 'legendary' ? 'bg-gradient-to-r from-gold to-gold-light' :
                        rarity === 'epic' ? 'bg-gradient-to-r from-primary to-primary-light' :
                        rarity === 'rare' ? 'bg-gradient-to-r from-info to-primary' :
                        'bg-gradient-metal'
                      } hover:opacity-90 text-white font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed metal-shine`}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {canAfford ? '구매하기' : '골드 부족'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 🔮 구매 확인 모달 (글래스메탈) */}
      <AnimatePresence>
        {showPurchaseModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPurchaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e: any) => e.stopPropagation()}
              className="glass-metal rounded-3xl p-10 max-w-md w-full relative metal-shine"
            >
              <div className="text-center mb-8">
                {(() => {
                  const rarity = ((selectedItem as any)?.rarity ?? ((selectedItem as any)?.min_rank ? 'rare' : 'common')) as string;
                  const styles = getRarityStyles(rarity);
                  return (
                    <div className={`glass-metal ${styles.bgColor} rounded-2xl w-24 h-24 mx-auto mb-6 flex items-center justify-center text-5xl border ${styles.borderColor} metal-shine`}>
                      {(selectedItem as any)?.icon ?? '🛒'}
                    </div>
                  );
                })()}
                
                {(() => {
                  const rarity = ((selectedItem as any)?.rarity ?? ((selectedItem as any)?.min_rank ? 'rare' : 'common')) as string;
                  return (
                    <h3 className={`text-2xl font-bold ${getRarityStyles(rarity).textColor} mb-3`}>
                      {selectedItem.name}
                    </h3>
                  );
                })()}
                <p className="text-muted-foreground mb-6">
                  정말로 구매하시겠습니까?
                </p>
                
                {(() => {
                  const discount = Number((selectedItem as any).discount_percent ?? 0);
                  const baseGold = Number((selectedItem as any).gold ?? 0);
                  const finalGold = Math.max(0, Math.floor(baseGold * (100 - discount) / 100));
                  return (
                    <>
                      <div className="text-3xl font-bold text-gradient-gold mb-2">
                        {finalGold.toLocaleString()}G
                      </div>
                      {discount > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          {baseGold.toLocaleString()}G
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 glass-metal-hover border-metal py-3"
                >
                  취소
                </Button>
                <Button
                  onClick={() => handlePurchase(selectedItem)}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-light glass-metal-hover py-3 metal-shine"
                >
                  구매
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
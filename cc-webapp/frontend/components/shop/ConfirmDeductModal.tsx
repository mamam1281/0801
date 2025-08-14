'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';

type ShopItemLike = {
  id: string;
  name: string;
  price: number;
  discount: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | string;
  icon?: React.ReactNode;
};

export type ConfirmDeductModalProps = {
  open: boolean;
  item: ShopItemLike | null;
  userBalance: number;
  onCancel: () => void;
  onConfirm: () => void;
};

function rarityTextColor(rarity: string) {
  switch (rarity) {
    case 'common':
      return 'text-muted-foreground';
    case 'rare':
      return 'text-info';
    case 'epic':
      return 'text-primary';
    case 'legendary':
      return 'text-gold';
    default:
      return 'text-muted-foreground';
  }
}

export function ConfirmDeductModal({ open, item, userBalance, onCancel, onConfirm }: ConfirmDeductModalProps) {
  if (!item) return null;

  const finalPrice = Math.floor(item.price * (1 - (item.discount || 0) / 100));
  const afterBalance = userBalance - finalPrice;

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onCancel(); }}>
      <DialogContent className="glass-metal rounded-2xl">
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${rarityTextColor(item.rarity)}`}>
            {item.name}
          </DialogTitle>
          <DialogDescription>
            포인트를 차감하여 구매하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{item.icon ?? '🛒'}</div>
            <div className="text-sm text-muted-foreground">
              현재 보유: <span className="font-semibold text-foreground">{userBalance.toLocaleString()}G</span>
            </div>
          </div>
          <div className="text-lg">
            결제 금액: <span className="font-bold text-gradient-gold">{finalPrice.toLocaleString()}G</span>
            {item.discount > 0 && (
              <span className="ml-2 text-sm text-muted-foreground line-through">{item.price.toLocaleString()}G</span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            결제 후 잔액: <span className={`font-semibold ${afterBalance < 0 ? 'text-error' : 'text-foreground'}`}>{afterBalance.toLocaleString()}G</span>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onCancel} className="glass-metal-hover">
            취소
          </Button>
          <Button onClick={onConfirm} className="bg-gradient-to-r from-primary to-primary-light glass-metal-hover text-white">
            확인하고 구매
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDeductModal;

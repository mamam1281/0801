"use client";

import * as React from "react";
import { cn } from "../../utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../dialog";

interface RewardData {
  type: 'token' | 'item' | 'bonus';
  amount?: number;
  name?: string;
  icon?: React.ReactNode;
}

interface RewardResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  reward?: RewardData;
  className?: string;
}

export default function RewardResultModal({ isOpen, onClose, type, title, message, reward, className }: RewardResultModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
      <DialogContent className={cn("sm:max-w-md", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3">
          {reward?.icon ?? null}
          <div>
            <p className="text-sm text-muted-foreground">{message}</p>
            {reward?.amount ? (
              <p className="text-base font-semibold mt-1">+{reward.amount}</p>
            ) : null}
            {reward?.name ? (
              <p className="text-sm mt-1">{reward.name}</p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

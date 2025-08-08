// API-facing shared types aligned with backend schemas
export interface GameListItem {
  id: string;
  name: string;
  description: string;
  type: string; // backend 'type' field (game_type)
  image_url: string;
  is_active: boolean;
  daily_limit?: number | null;
  playCount?: number;
  bestScore?: number;
  canPlay?: boolean;
  cooldown_remaining?: number | null;
  requires_vip_tier?: number | null;
}

export interface CrashBetResponse {
  success: boolean;
  game_id: string;
  bet_amount: number;
  potential_win: number;
  max_multiplier?: number | null;
  message: string;
  balance: number;
}

export interface CrashCashoutResponse {
  success: boolean;
  game_id: string;
  cashed_out_at: string; // ISO datetime
  win_amount: number;
  balance: number;
}

export interface SimpleGameStats {
  user_id: number;
  total_spins: number;
  total_coins_won: number;
  total_gems_won: number;
  special_items_won: number;
  jackpots_won: number;
  bonus_spins_won: number;
  best_streak: number;
  current_streak: number;
  last_spin_date?: string | null;
}

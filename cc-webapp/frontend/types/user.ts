export interface User {
  id: number;
  site_id: string;
  nickname: string;
  phone_number: string;
  cyber_token_balance: number;
  created_at: string;
  last_login: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface UserStats {
  total_games_played: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
}

export interface UserBalance {
  cyber_token_balance: number;
}

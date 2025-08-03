// API 응답 타입 정의
export interface User {
  id: number;
  site_id: string;
  nickname: string;
  phone_number: string;
  cyber_token_balance: number;
  rank: string;
  created_at: string;
}

export interface UserActivity {
  id: number;
  user_id: number;
  activity_type: string;
  timestamp: string;
  details: string;
  user?: User;
}

export interface Reward {
  id: number;
  user_id: number;
  reward_type: string;
  amount: number;
  reason: string;
  admin_id: number;
  created_at: string;
  user?: User;
}

export interface UserDetailResponse extends User {
  recent_activities: UserActivity[];
  recent_rewards: Reward[];
}

export interface GiveRewardRequest {
  user_id: number;
  reward_type: string;
  amount: number;
  reason: string;
  admin_id: number;
}

export interface ApiResponse<T> {
  data: T;
  status: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

import { 
  User, 
  UserDetailResponse, 
  UserActivity, 
  Reward, 
  GiveRewardRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:8000';

class AdminApiService {
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        // 추후 인증 토큰 추가
        // 'Authorization': `Bearer ${getAuthToken()}`,
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // 사용자 목록 조회
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);

    return this.fetchApi<PaginatedResponse<User>>(
      `/admin/users?${queryParams.toString()}`
    );
  }

  // 특정 사용자 상세 정보 조회
  async getUserDetail(userId: number): Promise<UserDetailResponse> {
    return this.fetchApi<UserDetailResponse>(`/admin/users/${userId}`);
  }

  // 사용자 활동 목록 조회
  async getActivities(params?: {
    skip?: number;
    limit?: number;
    user_id?: number;
  }): Promise<PaginatedResponse<UserActivity>> {
    const queryParams = new URLSearchParams();
    
    if (params?.skip) queryParams.append('skip', params.skip.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.user_id) queryParams.append('user_id', params.user_id.toString());

    return this.fetchApi<PaginatedResponse<UserActivity>>(
      `/admin/activities?${queryParams.toString()}`
    );
  }

  // 보상 지급
  async giveReward(rewardData: GiveRewardRequest): Promise<Reward> {
    return this.fetchApi<Reward>('/admin/rewards', {
      method: 'POST',
      body: JSON.stringify(rewardData),
    });
  }

  // 대시보드 통계 데이터 조회
  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalRewards: number;
    todayActivities: number;
  }> {
    return this.fetchApi<{
      totalUsers: number;
      activeUsers: number;
      totalRewards: number;
      todayActivities: number;
    }>('/admin/dashboard/stats');
  }
}

export const adminApiService = new AdminApiService();

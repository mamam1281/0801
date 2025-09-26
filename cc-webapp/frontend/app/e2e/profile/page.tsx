'use client';

import { ProfileScreen } from '@/components/ProfileScreen';
import ActionHistory from '@/components/profile/ActionHistory';

export default function E2EProfilePage() {
  return (
    // 테스트 안정성을 위해 최상위에 고정 data-testid를 부여
    <div data-testid="profile-screen">
      <ProfileScreen
        onBack={() => {}}
        onAddNotification={() => {}}
        retryEnabled={false}
        maxRetries={0}
        retryDelayMs={0}
      />
      {/* E2E 전용: 액션 이력 컴포넌트를 명시적으로 포함하여 selector 안정화 */}
      <div className="mt-4">
        <ActionHistory pageSize={10} />
      </div>
    </div>
  );
}

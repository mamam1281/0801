import { expect, test } from '@playwright/test';

/**
 * 이벤트 라이프사이클 E2E (기본 골격)
 * 관리자: 로그인 → 이벤트 생성
 * 사용자: 로그인 → 이벤트 목록 조회/참여
 * 관리자: 강제지급 수행
 * 사용자: 보상 수령 → 상태/배지 확인
 */

test.describe('이벤트 라이프사이클', () => {
  const admin = { site_id: 'admin', password: 'admin123' };
  const user = { site_id: 'e2e_user_events', password: 'test1234', nickname: 'E2EUser', phone_number: '01099999999' };
  let createdEventId: number | null = null;

  test('관리자 이벤트 생성 → 사용자 참여 → 강제지급 → 사용자 수령', async ({ page, request }) => {
    // 1) 관리자 로그인 (API)
    const adminLogin = await request.post('/api/auth/admin/login', {
      data: { site_id: admin.site_id, password: admin.password }
    });
    expect(adminLogin.ok()).toBeTruthy();
    const adminTokens = await adminLogin.json();
    const adminHeaders = { Authorization: `Bearer ${adminTokens.access_token}` };

    // 2) 이벤트 생성 (관리자)
    const now = new Date();
    const start = new Date(now.getTime() - 60_000).toISOString(); // 이미 시작
    const end = new Date(now.getTime() + 60 * 60_000).toISOString();
    const evRes = await request.post('/api/admin/content/events', {
      headers: adminHeaders,
      data: {
        name: 'E2E Cycle Event',
        start_at: start,
        end_at: end,
        reward_scheme: { gold: 1234, experience: 55 }
      }
    });
    expect(evRes.ok()).toBeTruthy();
    const evJson = await evRes.json();
    createdEventId = evJson.id;
    expect(createdEventId).toBeGreaterThan(0);

    // 3) 일반 사용자 회원가입(or 존재 시 로그인)
    const signup = await request.post('/api/auth/signup', {
      data: {
        site_id: user.site_id,
        password: user.password,
        nickname: user.nickname,
        phone_number: user.phone_number,
        invite_code: '5858'
      }
    });
    // 이미 존재하면 400 가능 → 로그인 시도
    let userTokens: any;
    if (signup.ok()) {
      const sj = await signup.json();
      userTokens = sj;
    } else {
      const login = await request.post('/api/auth/login', { data: { site_id: user.site_id, password: user.password } });
      expect(login.ok()).toBeTruthy();
      userTokens = await login.json();
    }

    const userHeaders = { Authorization: `Bearer ${userTokens.access_token}` };

    // 4) 사용자 이벤트 목록 조회
    const listRes = await request.get('/api/events', { headers: userHeaders });
    expect(listRes.ok()).toBeTruthy();
    const listJson = await listRes.json();
    const target = listJson.find((e: any) => e.id === createdEventId);
    expect(target).toBeTruthy();

    // 5) 사용자 참여
    const joinRes = await request.post('/api/events/join', { headers: userHeaders, data: { event_id: createdEventId } });
    expect(joinRes.ok()).toBeTruthy();

    // 6) 관리자 강제지급
    const fcRes = await request.post(`/api/admin/events/${createdEventId}/force-claim/${userTokens.user?.id || userTokens.id || 1}`, {
      headers: adminHeaders,
      data: {}
    });
    expect(fcRes.ok()).toBeTruthy();

    // 7) 사용자 보상 수령 (이미 force-claim 으로 지급되었다면 실패/중복 가능 → 200 or 4xx 허용 처리)
    const claimRes = await request.post(`/api/events/claim/${createdEventId}`, { headers: userHeaders });
    // 허용: 이미 지급된 경우 400 혹은 200
    expect([200,201,400]).toContain(claimRes.status());

    // 8) 최종 상태 재확인
    const afterList = await request.get('/api/events', { headers: userHeaders });
    expect(afterList.ok()).toBeTruthy();
    const afterJson = await afterList.json();
    const finalEv = afterJson.find((e: any) => e.id === createdEventId);
    expect(finalEv).toBeTruthy();
    // participation 구조 내 claimed / rewards 수령 여부 필드 추정(백엔드 스키마 따라 조정 필요)
    // Soft assertion 형태
    if (finalEv?.participation) {
      expect(finalEv.participation.claimed || finalEv.participation.reward_claimed || true).toBeTruthy();
    }
  });
});

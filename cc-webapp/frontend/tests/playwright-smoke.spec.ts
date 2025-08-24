import { test, expect } from '@playwright/test';

// 간단한 회원가입/로그인/프로필 스모크 (실제 라우트 명세에 따라 조정 필요)
// 프론트 UI 폼 상호작용 대신 백엔드 API 직접 호출로 빠른 안정성 확보

test.describe('Auth Smoke', () => {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:8000';
  const uid = 'smoke' + Date.now();

  test('signup + login + profile', async ({ request }) => {
    // 회원가입
    const signup = await request.post(`${apiBase}/api/auth/signup`, {
      data: {
        site_id: uid,
        nickname: uid,
        phone_number: '01099990000',
        invite_code: '5858',
        password: '1234'
      }
    });
    expect(signup.ok()).toBeTruthy();

    // 로그인
    const login = await request.post(`${apiBase}/api/auth/login`, { data: { site_id: uid, password: '1234' } });
    expect(login.ok()).toBeTruthy();
    const loginJson = await login.json();
    const token = loginJson.access_token;
    expect(token).toBeTruthy();

    // 프로필
  const profile = await request.get(`${apiBase}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(profile.ok()).toBeTruthy();
    const profileJson = await profile.json();
    expect(profileJson.site_id).toBe(uid);
  });
});

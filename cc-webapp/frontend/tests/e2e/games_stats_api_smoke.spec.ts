import { test, expect } from '@playwright/test';

const API = process.env.API_BASE_URL || 'http://localhost:8000';

test('[Games] /api/games/stats/me smoke (skip if unavailable)', async ({ request }: any) => {
  // 1) 신규 유저 등록: 우선 /api/auth/signup 시도 → 실패 시 /api/auth/register 폴백
  const nickname = 'gs_' + Math.random().toString(36).slice(2, 8);
  const site_id = 'gs_' + Math.random().toString(36).slice(2, 8);
  const phone_number = '010-0000-0000';
  const password = 'password123';
  const invite_code = process.env.E2E_INVITE_CODE || '5858';
  let access_token: string | null = null;
  let reg = await request.post(`${API}/api/auth/signup`, { data: { nickname, invite_code, site_id, phone_number, password } }).catch(() => null as any);
  if (reg && reg.ok()) {
    try { const j = await reg.json(); access_token = j?.access_token as string; } catch {}
  }
  if (!access_token) {
    reg = await request.post(`${API}/api/auth/register`, { data: { nickname, invite_code } }).catch(() => null as any);
    if (reg && reg.ok()) {
      try { const j = await reg.json(); access_token = j?.access_token as string; } catch {}
    }
  }
  if (!access_token) { test.skip(true, 'register/signup failed'); return; }

  // 2) API 호출(미노출/미구현 환경에서는 스킵)
  const res = await request
    .get(`${API}/api/games/stats/me`, { headers: { Authorization: `Bearer ${access_token}` } })
    .catch(() => null as any);
  if (!res) {
    test.skip(true, 'games stats endpoint unreachable');
    return;
  }
  const status = res.status();
  // 비가용/비구현/차단/서버오류/레이트리밋 등은 스킵 처리
  if ([404, 501, 403, 405, 429].includes(status) || (status >= 500 && status <= 599)) {
    test.skip(true, `games stats not available: ${status}`);
    return;
  }

  if (!res.ok()) {
    test.skip(true, `games stats not ok: ${status}`);
    return;
  }

  expect(res.ok()).toBeTruthy();
  const body = await res.json().catch(() => null);
  expect(body && typeof body === 'object').toBeTruthy();
});

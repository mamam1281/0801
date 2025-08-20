// 단순 API 헬퍼: 최소 기능 (base URL 결합 + JSON 직렬화 + 토큰 헤더)
// 복잡한 401 refresh / 재시도 / 에러 타입 계층 생략
// 사용 패턴:
//   import { apiGet, apiPost } from '@/lib/simpleApi';
//   const data = await apiGet('/api/streak/status');
// ENV: NEXT_PUBLIC_API_BASE 가 있다면 절대 base 로, 없으면 상대 경로 그대로(fetch가 Next 프록시 통해 동작)

// BASE 결정:
// 1) NEXT_PUBLIC_API_BASE 가 명시되면 그것을 사용
// 2) (임시 보호) 클라이언트 측에서 포트 3000(프론트 기본 dev) & 설정 미지정 시 http://localhost:8000 으로 자동 fallback
//    → /api/* 요청이 Next 자체 라우트로 흘러 404 나는 상황 방지 (VIP 등 백엔드 엔드포인트)
let _rawBase = process.env.NEXT_PUBLIC_API_BASE || '';
if (!_rawBase && typeof window !== 'undefined') {
  try {
    if (window.location.port === '3000') {
      _rawBase = 'http://localhost:8000';
      // 개발 편의를 위한 1회 경고
      if (!(window as any).__api_base_fallback_logged) {
        console.warn('[simpleApi] NEXT_PUBLIC_API_BASE 미설정 → http://localhost:8000 자동 적용 (개발용). 환경변수 설정을 권장');
        (window as any).__api_base_fallback_logged = true;
      }
    }
  } catch {}
}
const RAW_BASE = _rawBase;
const BASE = RAW_BASE.replace(/\/$/, '');

interface ReqOpts {
  params?: Record<string, any>;
  body?: any;
  token?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  // JSON 아닐 때 (예: FormData) 자동 처리 막기
  rawBody?: boolean;
  method?: string;
}

async function request<T=any>(path: string, opts: ReqOpts = {}): Promise<T> {
  const { params, body, token, headers = {}, signal, rawBody, method } = opts;
  let url = BASE + path;
  if (params && Object.keys(params).length) {
    const q = new URLSearchParams();
    for (const [k,v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      q.append(k, String(v));
    }
    url += (url.includes('?') ? '&' : '?') + q.toString();
  }
  const finalHeaders: Record<string,string> = { ...headers };
  if (!rawBody && body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: method || (body ? 'POST' : 'GET'),
    headers: finalHeaders,
    body: body === undefined ? undefined : (rawBody ? body : JSON.stringify(body)),
    signal,
    credentials: 'include', // 세션 쿠키 사용 가능성 대비
  });

  if (!res.ok) {
    let detail: any = null;
    try { detail = await res.json(); } catch {}
    const msg = detail?.detail || res.statusText || 'API Error';
    const error: any = new Error(msg);
    error.status = res.status;
    error.detail = detail;
    throw error;
  }

  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) return await res.json();
  // 비 JSON 응답은 text로 반환
  return await res.text() as any;
}

export const apiGet = <T=any>(path: string, opts: Omit<ReqOpts,'body'|'method'> = {}) => request<T>(path, { ...opts, method: 'GET' });
export const apiPost = <T=any>(path: string, body?: any, opts: Omit<ReqOpts,'body'|'method'> = {}) => request<T>(path, { ...opts, body, method: 'POST' });
export const apiReq = request;

/*
 * Unified API Client
 * - 단일 BASE ORIGIN (NEXT_PUBLIC_API_ORIGIN)
 * - 모든 경로 인자는 '/api/' prefix 없이(ex: 'auth/login', 'events/123/claim')
 * - 자동 /api 접두사 부착
 * - 토큰 번들(storage: cc_auth_tokens via utils/tokenStorage.js)
 * - 401 -> refresh 1회 재시도, 실패 시 토큰 제거
 * - 재시도: 네트워크/일부 5xx/429 지수백오프 (기본 2회) 옵션화
 * - 개발 환경 로깅(console.groupCollapsed)
 */

import { getTokens, setTokens, clearTokens } from '../utils/tokenStorage';

// Node 타입 미설치 환경 대비 간단 선언
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const process: any;

export interface UnifiedRequestOptions<T=any> {
  method?: string;
  body?: any;
  auth?: boolean;            // 기본 true (false면 Authorization 미부착)
  retry?: number;            // 재시도 횟수 (기본 2)
  backoffBaseMs?: number;    // 초기 backoff (기본 300)
  headers?: Record<string,string>;
  signal?: AbortSignal;
  parseJson?: boolean;       // false면 text 그대로 반환
  transform?: (data:any)=>T; // 결과 후처리
}

const DEFAULT_RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function resolveOrigin(): string {
  // Next.js 환경이면 process.env 존재하지만 타입 정의 없을 수 있어 any 캐스팅
  // (로컬 빌드에서 @types/node 미설치 상태 대비)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (typeof process !== 'undefined' ? (process as any).env?.NEXT_PUBLIC_API_ORIGIN : undefined);
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    // dev fallback (프론트 3000, 백 8000)
    const fallback = window.location.port === '3000' ? 'http://localhost:8000' : `${window.location.origin}`;
    if (!env) console.warn('[unifiedApi] NEXT_PUBLIC_API_ORIGIN 미설정 → fallback:', fallback);
    return fallback.replace(/\/$/, '');
  }
  return 'http://localhost:8000';
}

const ORIGIN = resolveOrigin();
// 다른 모듈에서 재사용할 수 있도록 공개
export const API_ORIGIN = ORIGIN;

async function refreshOnce(): Promise<boolean> {
  try {
    const tokens = getTokens();
    if (!tokens?.refresh_token) return false;
    const res = await fetch(`${ORIGIN}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refresh_token })
    });
    if (!res.ok) return false;
    const data = await res.json().catch(()=>null);
    if (data?.access_token) {
      setTokens({ access_token: data.access_token, refresh_token: data.refresh_token || tokens.refresh_token });
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function apiCall<T=any>(path: string, opts: UnifiedRequestOptions<T> = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    auth = true,
    retry = 2,
    backoffBaseMs = 300,
    headers = {},
    signal,
    parseJson = true,
    transform
  } = opts;

  if (path.startsWith('/')) path = path.slice(1); // normalize
  const url = `${ORIGIN}/api/${path}`;

  let attempt = 0;
  let didRefresh = false;

  while (true) {
    const tokens = getTokens();
    const finalHeaders: Record<string,string> = {
      'Accept': 'application/json',
      ...headers,
    };
    if (auth && tokens?.access_token) {
      finalHeaders['Authorization'] = `Bearer ${tokens.access_token}`;
    }
    if (body && !(body instanceof FormData)) {
      finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const devLog = (typeof process !== 'undefined' ? (process as any).env?.NODE_ENV : 'development') !== 'production';
    if (devLog && attempt === 0) {
      console.groupCollapsed(`[unifiedApi] ${method} ${url}`);
      console.log('opts', { method, body, auth, retry });
      console.groupEnd();
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: finalHeaders,
        body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
        signal,
        credentials: 'include',
      });
    } catch (networkErr:any) {
      if (attempt < retry) {
        const delay = backoffBaseMs * Math.pow(2, attempt);
        await new Promise(r=>setTimeout(r, delay));
        attempt++; continue;
      }
      throw networkErr;
    }

    if (response.status === 401 && auth && !didRefresh) {
      const refreshed = await refreshOnce();
      didRefresh = true;
      if (refreshed) { attempt++; continue; }
      clearTokens();
    }

    if (!response.ok) {
      if (attempt < retry && DEFAULT_RETRY_STATUS.has(response.status)) {
        const delay = backoffBaseMs * Math.pow(2, attempt);
        await new Promise(r=>setTimeout(r, delay));
        attempt++; continue;
      }
      const errText = await response.text().catch(()=>`HTTP ${response.status}`);
      throw new Error(`[unifiedApi] ${response.status} ${errText}`);
    }

    if (!parseJson) {
      // @ts-ignore
      return (await response.text()) as T;
    }
    const json = await response.json().catch(()=>null);
    // @ts-ignore
    return transform ? transform(json) : json;
  }
}

// 편의 메서드
export const api = {
  get: <T=any>(p:string, o:UnifiedRequestOptions<T>={}) => apiCall<T>(p, { ...o, method: 'GET' }),
  post:<T=any>(p:string, body?:any, o:UnifiedRequestOptions<T>={}) => apiCall<T>(p, { ...o, method:'POST', body }),
  put: <T=any>(p:string, body?:any, o:UnifiedRequestOptions<T>={}) => apiCall<T>(p, { ...o, method:'PUT', body }),
  del: <T=any>(p:string, o:UnifiedRequestOptions<T>={}) => apiCall<T>(p, { ...o, method:'DELETE' }),
};

// 대시보드 전용 shorthand (미사용이면 제거 가능)
export const dashboardApi = {
  fetch: () => api.get('dashboard'),
};

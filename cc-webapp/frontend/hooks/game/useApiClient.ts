import { useCallback } from 'react';

export interface ApiOptions<TBody = unknown> {
  method?: string;
  body?: TBody;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  authToken?: string | null;
}

export function buildQuery(params?: Record<string, any>) {
  if (!params) return '';
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export interface ApiErrorShape { detail?: string; [k: string]: any }

export function useApiClient(baseUrl = '/api') {
  const call = useCallback(
    async <TResponse = unknown, TBody = unknown>(
      path: string,
      opts: ApiOptions<TBody> = {}
    ): Promise<TResponse> => {
      const { method = 'GET', body, params, headers = {}, authToken } = opts;
      const query = buildQuery(params);
      const url = `${baseUrl}${path}${query}`;
      const h: Record<string, string> = { 'Content-Type': 'application/json', ...headers };
      if (authToken) h['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(url, {
        method,
        headers: h,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        let detail: ApiErrorShape | undefined;
        try { detail = await res.json(); } catch { /* ignore */ }
        throw new Error(detail?.detail || `API Error ${res.status}`);
      }
      // JSON parse 실패 시 undefined 반환 대신 에러 throw (명확성)
      const text = await res.text();
      if (!text) return undefined as unknown as TResponse;
      try {
        return JSON.parse(text) as TResponse;
      } catch {
        throw new Error('Invalid JSON response');
      }
    },
    [baseUrl]
  );
  return { call };
}

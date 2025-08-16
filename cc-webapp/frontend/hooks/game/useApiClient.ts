import { useCallback } from 'react';

interface ApiOptions {
  method?: string;
    body?: any;
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

export function useApiClient(baseUrl = '/api') {
    const call = useCallback(async <T = any>(path: string, opts: ApiOptions = {}): Promise<T> => {
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
        let detail: any = undefined;
        try { detail = await res.json(); } catch { /* ignore */ }
        throw new Error(detail?.detail || `API Error ${res.status}`);
    }
      try {
        return (await res.json()) as T;
    } catch {
        return undefined as unknown as T;
    }
  }, [baseUrl]);

  return { call };
}

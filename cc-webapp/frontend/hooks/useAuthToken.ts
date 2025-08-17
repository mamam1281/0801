// 간단한 로컬 스토리지 기반 액세스 토큰 취득 훅 (MVP 임시)
// TODO: 후속 - refresh 토큰 회전/만료 처리 통합
import { useCallback } from 'react';

export function useAuthToken() {
    const getAccessToken = useCallback((): string | undefined => {
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem('cc_auth_tokens') : null;
            if (!raw) return undefined;
            const parsed = JSON.parse(raw);
            return parsed?.access_token;
        } catch {
            return undefined;
        }
    }, []);

    return { getAccessToken };
}

export default useAuthToken;

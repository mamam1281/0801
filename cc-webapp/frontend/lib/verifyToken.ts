// SSR 미들웨어용 JWT 서명 검증 유틸 (백엔드 경량 검증 API 호출)
import axios from 'axios';

export async function verifyTokenSSR(token: string): Promise<boolean> {
  try {
    // 백엔드 경량 검증 엔드포인트 호출 (예: /api/auth/verify)
    const res = await axios.post(
      'http://localhost:8000/api/auth/verify',
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 1500,
      }
    );
    return res.data?.valid === true;
  } catch (e) {
    return false;
  }
}

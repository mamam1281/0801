import { cookies } from 'next/headers';
import App from './App';

export default async function Home() {
  const c = await cookies();
  const token = c.get('auth_token')?.value;
  if (!token) {
    // 서버 리다이렉트 타입 호환 이슈 회피: 클라이언트에서 안전 리다이렉트
    return (
      <>
        <noscript>
          <meta httpEquiv="refresh" content="0;url=/login" />
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: "location.replace('/login');" }} />
      </>
    );
  }
  // 인증된 경우 전체 애플리케이션 UI 렌더링 (대시보드/내비 포함)
  return <App />;
}


import App from './App';
import { cookies } from 'next/headers';

// 캐시 방지
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const c = await cookies();
  const token = c.get('auth_token')?.value;
  
  console.log('[PAGE] 메인 페이지 접근, 토큰:', token ? '있음' : '없음');
  
  if (!token) {
    console.log('[PAGE] 토큰 없음 → 로그인 리다이렉트');
    return (
      <>
        <noscript>
          <meta httpEquiv="refresh" content="0;url=/login" />
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: "location.replace('/login');" }} />
      </>
    );
  }
  
  console.log('[PAGE] 토큰 있음 → App 렌더링');
  return <App isAuthenticated={true} />;
}

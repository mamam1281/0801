
import { cookies } from 'next/headers';

export default async function Home() {
  const c = await cookies();
  const token = c.get('auth_token')?.value;
  if (!token) {
    return (
      <>
        <noscript>
          <meta httpEquiv="refresh" content="0;url=/login" />
        </noscript>
        <script dangerouslySetInnerHTML={{ __html: "location.replace('/login');" }} />
      </>
    );
  }
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Casino Club</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <a href="/events" className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors">
            <div className="text-lg font-semibold">이벤트</div>
            <div className="text-sm text-gray-400">참여/보상 수령</div>
          </a>
        </div>
      </div>
    </main>
  );
}

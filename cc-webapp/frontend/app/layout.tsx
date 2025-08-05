import '../styles/globals.css';

export const metadata = {
  title: '카지노 클럽 F2P',
  description: '환영합니다! 카지노 클럽 F2P에서 게임을 즐겨보세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}

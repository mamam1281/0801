import './globals.css';
import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Casino-Club F2P',
  description: 'Casino-Club Free-to-Play Web Application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-zinc-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

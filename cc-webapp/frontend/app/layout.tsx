import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionExpiredBanner } from "../components/SessionExpiredBanner";
import "../styles/globals.css";
import { Providers } from "./providers";

// Import warning suppression script
import "../lib/suppress-warnings.js";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Casino-Club F2P",
    template: "%s | Casino-Club F2P",
  },
  description: "Welcome to Casino-Club F2P! Play free and have fun.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="dark">
      <body className={inter.className}>
        <SessionExpiredBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

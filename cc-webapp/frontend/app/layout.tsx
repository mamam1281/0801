import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "./providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Casino-Club F2P",
  description: "Welcome to Casino-Club F2P!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Script id="cc-token-migrate" strategy="beforeInteractive">
          {`
            try {
              var BUNDLE='cc_auth_tokens';
              var LEGACY='cc_access_token';
              var raw=localStorage.getItem(BUNDLE);
              if(!raw){
                var legacy=localStorage.getItem(LEGACY);
                if(legacy){
                  var bundle={access_token: legacy, refresh_token: null};
                  try{ localStorage.setItem(BUNDLE, JSON.stringify(bundle)); }catch{}
                  try{ document.cookie = 'cc_access_token='+encodeURIComponent(legacy)+'; Path=/; SameSite=Lax'; }catch{}
                }
              } else {
                try {
                  var parsed = JSON.parse(raw);
                  if(parsed && parsed.access_token){
                    document.cookie = 'cc_access_token='+encodeURIComponent(parsed.access_token)+'; Path=/; SameSite=Lax';
                  }
                } catch {}
              }
            } catch {}
          `}
        </Script>
        {/* Early token migration (runs before hydration) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var BUNDLE='cc_auth_tokens';
                  var LEGACY='cc_access_token';
                  var raw=localStorage.getItem(BUNDLE);
                  if(!raw){
                    var legacy=localStorage.getItem(LEGACY);
                    if(legacy){
                      var bundle={access_token: legacy, refresh_token: null};
                      try{ localStorage.setItem(BUNDLE, JSON.stringify(bundle)); }catch{}
                      try{ document.cookie = 'cc_access_token='+encodeURIComponent(legacy)+'; Path=/; SameSite=Lax'; }catch{}
                    }
                  } else {
                    try {
                      var parsed = JSON.parse(raw);
                      if(parsed && parsed.access_token){
                        document.cookie = 'cc_access_token='+encodeURIComponent(parsed.access_token)+'; Path=/; SameSite=Lax';
                      }
                    } catch {}
                  }
                } catch {}
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

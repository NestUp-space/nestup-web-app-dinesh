import type { Metadata } from "next"
import { Inter, Source_Sans_3, JetBrains_Mono } from "next/font/google"
import "../styles/globals.css"
import { UserProvider } from '@/context/UserContext'; 
import { Analytics } from "@vercel/analytics/react"
import { GoogleAnalytics } from '@next/third-parties/google'
import { ApolloWrapper } from '@/components/providers/ApolloWrapper'
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider'
import { GA_MEASUREMENT_ID } from '@/lib/analytics'
import Script from 'next/script'

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ['400', '600', '700'],
  variable: '--font-source-sans-pro'
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains-mono'
});

export const metadata: Metadata = {
  title: {
    default: "Nestup.space",
    template: "%s | Nestup.space",
  },
  description: "Designer Modular Factory — Modular interior design and furniture manufacturing platform",
  icons: {
    icon: '/img/NestupLogoOnly.svg',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://nestup.space'),
  openGraph: {
    title: "Nestup.space",
    description: "Designer Modular Factory — Modular interior design and furniture manufacturing platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Chunk load error recovery (workaround for Next.js ChunkLoadError timeout) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var failedChunks = new Set();
                function retryChunk(url, maxRetries) {
                  maxRetries = maxRetries || 3;
                  if (failedChunks.has(url)) return;
                  var retries = 0;
                  function load() {
                    if (retries >= maxRetries) { failedChunks.add(url); return; }
                    retries++;
                    var s = document.createElement('script');
                    s.src = url;
                    s.async = true;
                    s.onerror = function() { setTimeout(load, 1000 * retries); };
                    document.head.appendChild(s);
                  }
                  load();
                }
                window.addEventListener('error', function(e) {
                  if (e.target && e.target.tagName === 'SCRIPT' && e.target.src && e.target.src.indexOf('/_next/') !== -1) {
                    retryChunk(e.target.src);
                  }
                }, true);
                window.onerror = function(msg, url) {
                  if (url && url.indexOf('/_next/') !== -1 && (msg.indexOf('chunk') !== -1 || msg.indexOf('Loading') !== -1)) {
                    retryChunk(url);
                  }
                  return false;
                };
              })();
            `,
          }}
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF8A00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Nestup" />
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
            });
          `}
        </Script>
        
        {/* PageSense Analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,s){var e=document.createElement("script");e.type="text/javascript";e.async=true;e.src="https://cdn-in.pagesense.io/js/60044136648/30c7cb1f94964f17acf0132c17f1f563.js";var x=document.getElementsByTagName("script")[0];x.parentNode.insertBefore(e,x);})(window,"script");
            `,
          }}
        />
      </head>
    <body className={`${inter.variable} ${sourceSans.variable} ${jetbrains.variable}`}>
        {/* Vercel Analytics */}
        <Analytics/>
        
        <ApolloWrapper>
          <UserProvider>
            <AnalyticsProvider>
              <div >
                {children}
              </div>
            </AnalyticsProvider>
          </UserProvider>
        </ApolloWrapper>
        
        {/* Google Analytics using Next.js third-party integration */}
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            }
          `}
        </Script>
      </body>
    </html>
  );
}

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
  title: "Nestup.space",
  description: "Desiner Modular Factory",
  icons: {
    icon: '/img/NestupLogoOnly.svg',
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
      </body>
    </html>
  );
}

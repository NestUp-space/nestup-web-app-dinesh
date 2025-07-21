import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { UserProvider } from '@/context/UserContext'; 
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] });

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,s){var e=document.createElement("script");e.type="text/javascript";e.async=true;e.src="https://cdn-in.pagesense.io/js/60044136648/30c7cb1f94964f17acf0132c17f1f563.js";var x=document.getElementsByTagName("script")[0];x.parentNode.insertBefore(e,x);})(window,"script");
            `,
          }}
        />
      </head>
    <body className={inter.className}>
    <Analytics/>
    <UserProvider>
      <div >
        {children}
      </div>
    </UserProvider>
    </body>
  </html>
  );
}

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

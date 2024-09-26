import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nestup.space",
  description: "Desiner Modular Factory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    <body className={inter.className}>
      <div className="h-24 top-0 fixed bg-white z-50">
          <Navbar />
        </div>
        <div className="mt-24">
          {children}
        </div>
    </body>
  </html>
  );
}

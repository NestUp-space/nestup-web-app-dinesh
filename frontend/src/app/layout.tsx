import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import "../styles/globals.css";

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
        <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar/>
        </div>  
        <div className="container px-auto mt-[7vh] min-h-[93vh]">
          {children}
        </div>  
      </body>
    </html>
  );
}

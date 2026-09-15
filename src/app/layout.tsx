import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Coin Caret | Next-Generation Web3 Digital Asset Platform",
  description: "Institutional-grade digital asset infrastructure, high-throughput blockchain settlement, and non-custodial wallet management.",
  metadataBase: new URL("http://127.0.0.1:3847"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0B0F17] text-slate-100 min-h-screen antialiased`}>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}

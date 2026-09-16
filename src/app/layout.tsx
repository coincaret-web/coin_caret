import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { JsonLd } from "@/components/seo/JsonLd";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0B0F17",
};

export const metadata: Metadata = {
  title: {
    default: "Coin Caret | High-Throughput Web3 Double-Entry Financial Platform",
    template: "%s | Coin Caret",
  },
  description:
    "Institutional-grade digital asset infrastructure, high-throughput 10s blockchain settlement, verifiable cryptographic double-entry ledger accounting, and non-custodial wallet management.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3847"),
  keywords: [
    "Coin Caret",
    "CC",
    "Web3 Wallet",
    "Double-Entry Ledger",
    "Block Explorer",
    "Digital Asset Platform",
    "Blockchain Settlement",
    "Crypto Payments",
  ],
  authors: [{ name: "Coin Caret Platform Foundation" }],
  creator: "Coin Caret Platform Foundation",
  publisher: "Coin Caret Platform Foundation",
  openGraph: {
    title: "Coin Caret | High-Throughput Web3 Financial Engine",
    description:
      "Verifiable cryptographic double-entry accounting with 10.0s block settlement and 3-tier transaction confirmation finality.",
    url: "http://127.0.0.1:3847",
    siteName: "Coin Caret",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coin Caret | High-Throughput Web3 Financial Engine",
    description:
      "Verifiable cryptographic double-entry accounting with 10.0s block settlement and 3-tier transaction confirmation finality.",
    creator: "@coincaret",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <JsonLd />
      </head>
      <body className={`${inter.className} bg-[#0B0F17] text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950`}>
        <AuthProvider>
          <SmoothScrollProvider>
            {children}
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

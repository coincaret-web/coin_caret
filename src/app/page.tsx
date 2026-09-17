import React from "react";
import Link from "next/link";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { Navbar } from "@/components/marketing/Navbar";
import { AssetTicker, AssetTickerItem } from "@/components/marketing/AssetTicker";
import { LiveNetworkStats } from "@/components/marketing/LiveNetworkStats";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { ArchitectureShowcase } from "@/components/marketing/ArchitectureShowcase";
import { Footer } from "@/components/marketing/Footer";
import { ArrowRight, ShieldCheck, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { getOrRefreshCryptoPrices, SUPPORTED_COINS } from "@/modules/market/service/price-feed.service";
import { getCcUsdRate } from "@/modules/admin/service/platform-config.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cryptoData, ccRateData] = await Promise.all([
    getOrRefreshCryptoPrices().catch(() => ({ prices: {} as any, isStale: true })),
    getCcUsdRate().catch(() => ({ rate: "0.25", updatedAt: new Date().toISOString() })),
  ]);

  const tickerItems: AssetTickerItem[] = [
    {
      symbol: "CC",
      name: "Coin Caret",
      usdPrice: ccRateData.rate || "0.25",
      change24h: "+5.4%",
    },
    ...SUPPORTED_COINS.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      usdPrice: cryptoData.prices[c.id]?.usdPrice || c.fallbackPrice,
      change24h: "+2.8%",
    })),
  ];

  return (
    <main className="min-h-screen bg-[#0B0F17] flex flex-col justify-between text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Rolling Multi-Currency Price Ticker */}
      <AssetTicker items={tickerItems} />

      {/* 3. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <LayoutContainer className="relative z-10 text-center">
          {/* Mainnet Live Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-8 shadow-inner shadow-cyan-500/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Coin Caret Multi-Asset Mainnet Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-mono">8 Currencies Supported</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
            The Multi-Currency Engine Built for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
              Trading & Settlement Precision
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Experience high-throughput blockchain settlement, instant zero-slippage cross-asset swaps, verifiable double-entry accounting, and institutional multi-currency digital asset vaults.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/wallet"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-base transition-all shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 group hover:scale-[1.02]"
            >
              <span>Open Web Wallet</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/wallet/swap"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-base transition-all flex items-center justify-center space-x-2 hover:border-slate-700"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Instant Cross-Asset Swap</span>
            </Link>
            <Link
              href="/explorer"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/80 text-slate-400 hover:text-white font-semibold text-base transition-all flex items-center justify-center space-x-2"
            >
              <span>Block Explorer</span>
              <ArrowUpRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>

          {/* 4. Live Network Metrics Strip */}
          <div className="mt-16 pt-8 border-t border-slate-800/80">
            <LiveNetworkStats />
          </div>
        </LayoutContainer>
      </section>

      {/* 5. Core Protocol Feature Grid */}
      <LayoutContainer>
        <FeatureGrid />
      </LayoutContainer>

      {/* 6. Settlement Architecture Showcase */}
      <LayoutContainer>
        <ArchitectureShowcase />
      </LayoutContainer>

      {/* 7. Security Invariants Section */}
      <section id="security" className="py-24 border-t border-slate-800/80 bg-slate-950/40">
        <LayoutContainer>
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-950/80 border border-cyan-500/20 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Float Mathematical Guarantee</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Zero Ledger Drift. Zero Phantom Minting.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                All ledger entries use exact Decimal(28, 8) precision executed inside isolated database transactions across all 8 supported currencies. From treasury creation to cross-asset swaps, every credit is mathematically backed by an exact debit.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-xs font-mono text-cyan-300">
                <div className="px-3.5 py-2 rounded-lg bg-cyan-950/50 border border-cyan-800/60">
                  ∑ Debits == ∑ Credits
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-cyan-950/50 border border-cyan-800/60">
                  8 Multi-Currency Vaults
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-cyan-950/50 border border-cyan-800/60">
                  Atomic Dual-Leg Swaps
                </div>
              </div>
            </div>
          </div>
        </LayoutContainer>
      </section>

      {/* 8. Footer */}
      <Footer />
    </main>
  );
}

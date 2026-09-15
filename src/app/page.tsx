import React from "react";
import Link from "next/link";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { Navbar } from "@/components/marketing/Navbar";
import { LiveNetworkStats } from "@/components/marketing/LiveNetworkStats";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { ArchitectureShowcase } from "@/components/marketing/ArchitectureShowcase";
import { Footer } from "@/components/marketing/Footer";
import { ArrowRight, ShieldCheck, Sparkles, Terminal, ArrowUpRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0F17] flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <LayoutContainer className="relative z-10 text-center">
          {/* Mainnet Live Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8 shadow-inner shadow-emerald-500/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Coin Caret Mainnet Active</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-mono">Block Interval 10.0s</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
            The Digital Currency Engine Built for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Speed and Precision
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Experience high-throughput blockchain settlement, verifiable cryptographic double-entry ledger accounting, and seamless digital asset management.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/wallet"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 group hover:scale-[1.02]"
            >
              <button className="flex items-center space-x-2">
                <span>Open CC Wallet</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link
              href="/explorer"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-base transition-all flex items-center justify-center space-x-2 hover:border-slate-700"
            >
              <button className="flex items-center space-x-2">
                <span>Live Block Explorer</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </Link>
          </div>

          {/* 3. Live Network Metrics Strip */}
          <div className="mt-16 pt-8 border-t border-slate-800/80">
            <LiveNetworkStats />
          </div>
        </LayoutContainer>
      </section>

      {/* 4. Core Protocol Feature Grid */}
      <LayoutContainer>
        <FeatureGrid />
      </LayoutContainer>

      {/* 5. Settlement Architecture Showcase */}
      <LayoutContainer>
        <ArchitectureShowcase />
      </LayoutContainer>

      {/* 6. Security Invariants Section */}
      <section id="security" className="py-24 border-t border-slate-800/80 bg-slate-950/40">
        <LayoutContainer>
          <div className="p-10 md:p-14 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-950/80 border border-emerald-500/20 backdrop-blur-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero-Float Mathematical Guarantee</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Zero Ledger Drift. Zero Phantom Minting.
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
                All ledger entries use exact Decimal(28, 8) precision executed inside isolated database transactions. From treasury creation to final settlement, every credit is mathematically backed by an exact debit.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-xs font-mono text-emerald-300">
                <div className="px-3.5 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60">
                  ∑ Debits == ∑ Credits
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60">
                  SHA-256 Merkle Root
                </div>
                <div className="px-3.5 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800/60">
                  Idempotency Protected
                </div>
              </div>
            </div>
          </div>
        </LayoutContainer>
      </section>

      {/* 7. Footer */}
      <Footer />
    </main>
  );
}

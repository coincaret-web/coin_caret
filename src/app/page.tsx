import React from "react";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { ArrowRight, Shield, Zap, Activity } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0F17] flex flex-col justify-between">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-50">
        <LayoutContainer className="h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 text-xl tracking-wider">
              CC
            </div>
            <span className="font-bold text-xl tracking-tight text-white">COIN CARET</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">Ecosystem</span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">Live Network</span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">Explorer</span>
            <span className="hover:text-emerald-400 transition-colors cursor-pointer">Security</span>
          </nav>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-300 hover:text-white transition-colors cursor-pointer">Sign In</span>
            <button className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25">
              Launch App
            </button>
          </div>
        </LayoutContainer>
      </header>

      {/* Hero Section */}
      <section className="py-24 md:py-32 relative overflow-hidden flex-1 flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <LayoutContainer className="relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Coin Caret Mainnet Active • Block Interval 10.0s</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            The Digital Currency Engine Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Speed and Precision</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Experience high-throughput blockchain settlement, verifiable cryptographic double-entry ledger accounting, and seamless digital asset management.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center space-x-2 group">
              <span>Open CC Wallet</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base transition-all">
              Live Block Explorer
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">10.0s</div>
              <div className="text-sm text-slate-400 mt-1">Deterministic Block Time</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">100% Verifiable</div>
              <div className="text-sm text-slate-400 mt-1">Double-Entry Ledger Integrity</div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">3-Tier Settlement</div>
              <div className="text-sm text-slate-400 mt-1">Block Confirmations Protocol</div>
            </div>
          </div>
        </LayoutContainer>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 bg-slate-950/60">
        <LayoutContainer className="flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">Coin Caret Network</span>
            <span>•</span>
            <span>Mainnet Protocol v1.0</span>
          </div>
          <div>
            © {new Date().getFullYear()} Coin Caret. All rights reserved.
          </div>
        </LayoutContainer>
      </footer>
    </main>
  );
}

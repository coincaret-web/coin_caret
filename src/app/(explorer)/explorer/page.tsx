import React from "react";
import { Metadata } from "next";
import {
  getExplorerStats,
  getBlocks,
  getTransactions,
} from "@/modules/explorer/service/explorer.service";
import { UniversalSearchBar } from "@/components/explorer/UniversalSearchBar";
import { ExplorerStatsGrid } from "@/components/explorer/ExplorerStatsGrid";
import { LiveBlockFeed } from "@/components/explorer/LiveBlockFeed";
import { RecentTransactionsFeed } from "@/components/explorer/RecentTransactionsFeed";
import { Compass, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Block Explorer | Coin Caret (CC)",
  description:
    "Institutional public block explorer for Coin Caret blockchain. Real-time block stream, transaction ledger verification, address analytics, and cryptographic proofs.",
};

export default async function ExplorerPage() {
  const [stats, blocksData, txData] = await Promise.all([
    getExplorerStats(),
    getBlocks({ limit: 10 }),
    getTransactions({ limit: 10 }),
  ]);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero Banner & Universal Search */}
      <div className="relative rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-[#070A0F]/90 border border-cyan-500/20 p-6 sm:p-10 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>Coin Caret Consensus Ledger</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Coin Caret <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">Block Explorer</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            Inspect real-time blocks, cryptographically sealed Merkle trees, address portfolios, and on-chain double-entry settlement with sub-second precision.
          </p>

          <div className="pt-2">
            <UniversalSearchBar />
          </div>
        </div>
      </div>

      {/* Network Overview Stats */}
      <ExplorerStatsGrid stats={stats} />

      {/* Live 2-Column Feed: Blocks & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[560px]">
        <LiveBlockFeed initialBlocks={blocksData.blocks as any} />
        <RecentTransactionsFeed initialTransactions={txData.transactions as any} />
      </div>
    </div>
  );
}

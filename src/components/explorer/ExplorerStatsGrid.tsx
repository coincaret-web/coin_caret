"use client";

import React from "react";
import { Blocks, ArrowLeftRight, Flame, Coins, Clock } from "lucide-react";

interface ExplorerStatsGridProps {
  stats: {
    blockHeight: string;
    totalBlocks: number;
    totalTransactions: number;
    totalGasUsed: string;
    blockTimeSeconds: number;
    activeAddresses: number;
    circulatingSupply: string;
  };
}

export function ExplorerStatsGrid({ stats }: ExplorerStatsGridProps) {
  const cards = [
    {
      label: "Current Block Height",
      value: `#${stats.blockHeight}`,
      subtext: `${stats.totalBlocks.toLocaleString()} total sealed blocks`,
      icon: Blocks,
      color: "from-cyan-500 to-blue-500",
      border: "border-cyan-500/20",
    },
    {
      label: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      subtext: "Packaged & verified on-chain",
      icon: ArrowLeftRight,
      color: "from-emerald-500 to-teal-500",
      border: "border-emerald-500/20",
    },
    {
      label: "Network Gas Settled",
      value: `${stats.totalGasUsed} CC`,
      subtext: "Standard 0.50 CC per tx",
      icon: Flame,
      color: "from-amber-500 to-orange-500",
      border: "border-amber-500/20",
    },
    {
      label: "Circulating CC Supply",
      value: `${stats.circulatingSupply} CC`,
      subtext: "Derived from double-entry ledger",
      icon: Coins,
      color: "from-purple-500 to-indigo-500",
      border: "border-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`p-5 rounded-2xl bg-slate-900/60 border ${card.border} backdrop-blur-md shadow-xl flex flex-col justify-between hover:bg-slate-900/80 transition-all group`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.label}
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${card.color} flex items-center justify-center text-slate-950 font-bold group-hover:scale-110 transition-transform shadow-md`}
              >
                <Icon className="w-4 h-4 text-slate-950" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                <span>{card.subtext}</span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

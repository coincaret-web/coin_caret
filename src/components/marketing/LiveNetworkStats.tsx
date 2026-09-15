"use client";

import React, { useEffect, useState } from "react";
import { Zap, ShieldCheck, Activity, Layers, Server, Coins } from "lucide-react";

export interface NetworkStatsData {
  blockHeight: number;
  latestBlockHash?: string;
  totalTransactions: number;
  avgBlockTime: string;
  circulatingSupply: string;
  gasPrice: string;
  activeValidators?: number;
  networkStatus?: string;
}

interface LiveNetworkStatsProps {
  initialStats?: NetworkStatsData;
}

export function LiveNetworkStats({ initialStats }: LiveNetworkStatsProps) {
  const [stats, setStats] = useState<NetworkStatsData>(
    initialStats || {
      blockHeight: 14280,
      totalTransactions: 98450,
      avgBlockTime: "10.0s",
      circulatingSupply: "10,000,000.00 CC",
      gasPrice: "0.0005 CC",
      activeValidators: 24,
      networkStatus: "ACTIVE",
    }
  );

  useEffect(() => {
    // If running in browser and no initialStats or want live updates
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/network/stats");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStats(data);
          }
        }
      } catch (err) {
        // Silently continue with previous stats
      }
    };

    const interval = setInterval(fetchStats, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const metrics = [
    {
      label: "Block Height",
      value: stats.blockHeight ? Number(stats.blockHeight).toLocaleString("en-US") : "14,280",
      subtext: "10.0s Cadence",
      icon: Layers,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Avg Block Time",
      value: stats.avgBlockTime || "10.0s",
      subtext: "Deterministic Finality",
      icon: Zap,
      color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
    },
    {
      label: "Total Transactions",
      value: stats.totalTransactions ? Number(stats.totalTransactions).toLocaleString("en-US") : "98,450",
      subtext: "Cryptographically Verified",
      icon: Activity,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
    {
      label: "Circulating Supply",
      value: stats.circulatingSupply || "10,000,000.00 CC",
      subtext: "Strict Zero-Sum Invariant",
      icon: Coins,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Average Gas Fee",
      value: stats.gasPrice || "0.0005 CC",
      subtext: "Predictable Micro-Costs",
      icon: ShieldCheck,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Active Consensus Nodes",
      value: stats.activeValidators ? `${stats.activeValidators} Nodes` : "24 Nodes",
      subtext: "Institutional Mesh",
      icon: Server,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {metrics.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md hover:border-slate-700/80 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg border ${item.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                {item.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-normal truncate">
                {item.subtext}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

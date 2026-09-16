"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowUpRight, CheckCircle2, Clock, ChevronRight, Hash } from "lucide-react";

export interface ExplorerTransaction {
  id: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: string;
  confirmations: number;
  createdAt: string;
}

interface RecentTransactionsFeedProps {
  initialTransactions: ExplorerTransaction[];
}

export function RecentTransactionsFeed({ initialTransactions }: RecentTransactionsFeedProps) {
  const [transactions, setTransactions] = useState<ExplorerTransaction[]>(initialTransactions);

  // Auto-refresh transactions every 6 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/explorer/transactions?limit=10");
        if (res.ok) {
          const data = await res.json();
          if (data.transactions) {
            setTransactions(data.transactions);
          }
        }
      } catch (err) {
        // silent fail on polling error
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const formatHash = (hash: string) => {
    if (!hash || hash.length <= 16) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 14) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getStatusBadge = (status: string, confirmations: number) => {
    if (status === "CONFIRMED" || confirmations >= 3) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>Confirmed (3/3)</span>
        </span>
      );
    }
    if (status === "CONFIRMING" || status === "BLOCK_ASSIGNED" || confirmations > 0) {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold animate-pulse">
          <Clock className="w-2.5 h-2.5" />
          <span>Confirming ({confirmations}/3)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
        <Clock className="w-2.5 h-2.5" />
        <span>In Mempool</span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Latest Transactions</h3>
            <p className="text-xs text-slate-400">Verified transfer and minting activity</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
          <span>Live Stream</span>
        </div>
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-slate-800/60 flex-1 overflow-y-auto mt-2 -mx-2 px-2">
        {transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <Hash className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
            No recent transactions found.
          </div>
        ) : (
          transactions.map((tx) => (
            <div
              key={tx.id || tx.txHash}
              className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400 shrink-0 group-hover:border-emerald-500/40 transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/explorer/tx/${tx.txHash}`}
                      className="font-bold text-sm text-slate-200 hover:text-emerald-400 font-mono flex items-center space-x-1"
                      title={tx.txHash}
                    >
                      <span>{formatHash(tx.txHash)}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    {getStatusBadge(tx.status, tx.confirmations)}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 font-mono">
                    <span>From</span>
                    <Link
                      href={`/explorer/address/${tx.fromAddress}`}
                      className="text-cyan-400/90 hover:text-cyan-300 hover:underline"
                    >
                      {formatAddress(tx.fromAddress)}
                    </Link>
                    <span>➔</span>
                    <span>To</span>
                    <Link
                      href={`/explorer/address/${tx.toAddress}`}
                      className="text-cyan-400/90 hover:text-cyan-300 hover:underline"
                    >
                      {formatAddress(tx.toAddress)}
                    </Link>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-black text-white font-mono">
                  {tx.amount} CC
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {timeAgo(tx.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-auto border-t border-slate-800/60">
        <Link
          href="/explorer/transactions"
          className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center space-x-1 transition-colors border border-slate-700/50"
        >
          <span>View All Transactions</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

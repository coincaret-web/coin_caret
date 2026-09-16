"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Copy,
  Check,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CheckCircle2,
  Coins,
  History,
} from "lucide-react";

interface AddressDetailViewProps {
  data: {
    address: string;
    isValidChecksum: boolean;
    displayName: string;
    balances: {
      available: string;
      reserved: string;
      total: string;
    };
    metrics: {
      totalSent: string;
      totalReceived: string;
      transactionCount: number;
    };
    transactions: any[];
  };
}

export function AddressDetailView({ data }: AddressDetailViewProps) {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(data.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/explorer"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explorer</span>
        </Link>
      </div>

      {/* Header Address Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <Wallet className="w-4 h-4" />
              <span>Address Portfolio Overview</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white font-mono break-all">
              {data.address}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium">
                {data.displayName}
              </span>
              {data.isValidChecksum ? (
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Valid SHA-256 Checksum</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                  Invalid Checksum
                </span>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={copyAddress}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 hover:text-white flex items-center space-x-2 transition-colors border border-slate-700/60 shadow-lg"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied Address</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3-Card Balances Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Total CC Holdings
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
              {data.balances.total} CC
            </div>
            <span className="text-[11px] text-slate-400">Available + Reserved</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">
              Available For Transfer
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
              {data.balances.available} CC
            </div>
            <span className="text-[11px] text-slate-400">Settled on double-entry ledger</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <span className="text-xs text-cyan-400 font-medium uppercase tracking-wider">
              Total Inflow vs Outflow
            </span>
            <div className="text-sm font-mono text-slate-200 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Received:</span>
                <span className="text-emerald-400 font-bold">+{data.metrics.totalReceived} CC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sent:</span>
                <span className="text-rose-400 font-bold">-{data.metrics.totalSent} CC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-base text-white">
              Address Activity ({data.transactions.length})
            </h3>
          </div>
        </div>

        {data.transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No transactions found for this address yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {data.transactions.map((tx: any) => {
              const isOutgoing = tx.fromAddress.toLowerCase() === data.address.toLowerCase();
              return (
                <div
                  key={tx.id || tx.txHash}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isOutgoing
                          ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                          : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      {isOutgoing ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/explorer/tx/${tx.txHash}`}
                          className="font-mono text-sm font-bold text-slate-200 hover:text-cyan-400 break-all"
                        >
                          {tx.txHash.slice(0, 12)}...{tx.txHash.slice(-8)}
                        </Link>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                          {isOutgoing ? "OUT" : "IN"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 font-mono">
                        <span>{isOutgoing ? `To ${tx.toAddress.slice(0, 10)}...` : `From ${tx.fromAddress.slice(0, 10)}...`}</span>
                        <span>•</span>
                        <span>{new Date(tx.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-black font-mono ${
                        isOutgoing ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {isOutgoing ? "-" : "+"}
                      {tx.amount} CC
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {tx.confirmations >= 3 ? "Finalized (3/3)" : `${tx.confirmations}/3 conf`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

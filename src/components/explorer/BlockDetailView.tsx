"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Blocks,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  GitBranch,
} from "lucide-react";

interface BlockDetailViewProps {
  block: any;
}

export function BlockDetailView({ block }: BlockDetailViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const currentHeight = BigInt(block.height);
  const prevHeight = currentHeight > 1n ? (currentHeight - 1n).toString() : null;
  const nextHeight = (currentHeight + 1n).toString();

  const transactions =
    block.blockTransactions?.map((bt: any) => bt.transaction) ||
    block.transactions ||
    [];

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/explorer"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Explorer</span>
        </Link>
        <div className="flex items-center space-x-2">
          {prevHeight && (
            <Link
              href={`/explorer/block/${prevHeight}`}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              ← Block #{prevHeight}
            </Link>
          )}
          <Link
            href={`/explorer/block/${nextHeight}`}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            Block #{nextHeight} →
          </Link>
        </div>
      </div>

      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <Blocks className="w-4 h-4" />
              <span>Sealed Block Header</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-mono">
              Block #{block.height}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
              {block.status}
            </span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div>
            <span className="text-xs text-slate-400">Transactions</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              {block.transactionCount} txns
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Gas Consumption</span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              {block.gasUsed} CC
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Block Cadence</span>
            <div className="text-lg font-bold text-white font-mono mt-0.5">
              10.0 Seconds
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400">Timestamp</span>
            <div className="text-xs font-medium text-slate-300 font-mono mt-1">
              {new Date(block.createdAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Cryptographic Proofs Table */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
        {/* Block Hash */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Block SHA-256 Hash
          </span>
          <div className="sm:col-span-2 flex items-center space-x-2">
            <span className="font-mono text-sm text-cyan-400 break-all">{block.blockHash}</span>
            <button
              onClick={() => copyToClipboard(block.blockHash, "blockHash")}
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              {copiedField === "blockHash" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Parent Hash */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Parent Block Hash
          </span>
          <div className="sm:col-span-2 flex items-center space-x-2">
            <span className="font-mono text-sm text-slate-300 break-all">{block.parentHash}</span>
            <button
              onClick={() => copyToClipboard(block.parentHash, "parentHash")}
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              {copiedField === "parentHash" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Merkle Root */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>Merkle Tree Root</span>
          </span>
          <div className="sm:col-span-2 flex items-center space-x-2">
            <span className="font-mono text-sm text-purple-400 break-all">{block.merkleRoot}</span>
            <button
              onClick={() => copyToClipboard(block.merkleRoot, "merkleRoot")}
              className="text-slate-400 hover:text-white transition-colors shrink-0"
            >
              {copiedField === "merkleRoot" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Block Transactions List */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-base text-white">Block Transactions ({transactions.length})</h3>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            Empty block with zero transactions.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((tx: any, idx: number) => (
              <div
                key={tx.id || tx.txHash}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/30 px-3 rounded-xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 rounded bg-slate-800 text-slate-400 text-xs font-mono flex items-center justify-center font-bold">
                    {idx}
                  </span>
                  <div>
                    <Link
                      href={`/explorer/tx/${tx.txHash}`}
                      className="font-mono text-sm font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 break-all"
                    >
                      <span>{tx.txHash}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 font-mono">
                      <span>From {tx.fromAddress?.slice(0, 8)}...</span>
                      <span>➔</span>
                      <span>To {tx.toAddress?.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-white font-mono">{tx.amount} CC</div>
                  <div className="text-xs text-slate-400 font-mono">{tx.fee} CC fee</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

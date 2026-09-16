"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ArrowRight,
  Blocks,
  ShieldCheck,
  FileCode,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

interface TransactionDetailViewProps {
  tx: any;
}

export function TransactionDetailView({ tx }: TransactionDetailViewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const confirmations = tx.confirmations || 0;
  const isFinalized = tx.status === "CONFIRMED" || confirmations >= 3;

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
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>{showRawJson ? "Hide JSON" : "Raw JSON"}</span>
        </button>
      </div>

      {/* Raw JSON Modal / Section */}
      {showRawJson && (
        <div className="p-4 rounded-2xl bg-black/80 border border-cyan-500/30 font-mono text-xs text-cyan-300 overflow-x-auto shadow-2xl">
          <pre>{JSON.stringify(tx, null, 2)}</pre>
        </div>
      )}

      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified On-Chain Transaction</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-mono break-all">
              {tx.txHash}
            </h1>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(tx.txHash, "txHash")}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center space-x-1.5 transition-colors border border-slate-700/60"
            >
              {copiedField === "txHash" ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Hash</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Hash</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3-Tier Confirmation Progress Bar */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-400">Settlement Lifecycle:</span>
            <span
              className={`font-bold font-mono ${
                isFinalized ? "text-emerald-400" : "text-cyan-400"
              }`}
            >
              {isFinalized ? "Terminal Confirmed (3/3)" : `Confirming (${confirmations}/3)`}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div
              className={`h-2 rounded-full transition-all ${
                confirmations >= 1
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-slate-800"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                confirmations >= 2
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-slate-800"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                confirmations >= 3
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-slate-800"
              }`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
            <span>Tier 1: Mempool Sealed</span>
            <span>Tier 2: Block Linked</span>
            <span>Tier 3: Ledger Finalized</span>
          </div>
        </div>
      </div>

      {/* Granular Properties Table */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
        {/* Status */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Status
          </span>
          <div className="sm:col-span-2">
            {isFinalized ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CONFIRMED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                <span>IN PROGRESS ({confirmations}/3)</span>
              </span>
            )}
          </div>
        </div>

        {/* Block Height */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Block Height
          </span>
          <div className="sm:col-span-2">
            {tx.blockHeight ? (
              <Link
                href={`/explorer/block/${tx.blockHeight}`}
                className="inline-flex items-center space-x-2 font-mono font-bold text-sm text-cyan-400 hover:text-cyan-300 hover:underline"
              >
                <Blocks className="w-4 h-4 text-cyan-400" />
                <span>#{tx.blockHeight}</span>
              </Link>
            ) : (
              <span className="text-xs text-amber-400 font-mono">Pending Next Block Minter</span>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Timestamp
          </span>
          <div className="sm:col-span-2 text-sm text-slate-300 font-mono">
            {new Date(tx.createdAt).toUTCString()} ({new Date(tx.createdAt).toLocaleString()})
          </div>
        </div>

        {/* From Address */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            From Address
          </span>
          <div className="sm:col-span-2 flex items-center space-x-2">
            <Link
              href={`/explorer/address/${tx.fromAddress}`}
              className="font-mono text-sm text-cyan-400 hover:text-cyan-300 hover:underline break-all"
            >
              {tx.fromAddress}
            </Link>
            <button
              onClick={() => copyToClipboard(tx.fromAddress, "fromAddress")}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {copiedField === "fromAddress" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* To Address */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            To Address
          </span>
          <div className="sm:col-span-2 flex items-center space-x-2">
            <Link
              href={`/explorer/address/${tx.toAddress}`}
              className="font-mono text-sm text-cyan-400 hover:text-cyan-300 hover:underline break-all"
            >
              {tx.toAddress}
            </Link>
            <button
              onClick={() => copyToClipboard(tx.toAddress, "toAddress")}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {copiedField === "toAddress" ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Value */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Amount Transferred
          </span>
          <div className="sm:col-span-2">
            <span className="text-lg font-black text-white font-mono">
              {tx.amount} CC
            </span>
          </div>
        </div>

        {/* Gas Fee */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Network Gas Fee
          </span>
          <div className="sm:col-span-2 text-sm text-slate-300 font-mono">
            {tx.fee} CC
          </div>
        </div>

        {/* Total Debit */}
        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Sender Debit
          </span>
          <div className="sm:col-span-2 text-sm font-bold text-white font-mono">
            {tx.totalDebit} CC
          </div>
        </div>

        {/* Note / Memo */}
        {tx.note && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaction Note
            </span>
            <div className="sm:col-span-2 text-sm text-slate-200">
              {tx.note}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

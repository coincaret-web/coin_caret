"use client";

import React from "react";
import Link from "next/link";
import { X, ExternalLink, ShieldCheck, Clock, CheckCircle2, Copy } from "lucide-react";
import { TransactionSummaryItem } from "./RecentActivityTable";

interface TransactionDrawerProps {
  transaction: TransactionSummaryItem | null;
  onClose: () => void;
}

export function TransactionDrawer({ transaction, onClose }: TransactionDrawerProps) {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Cryptographic Receipt
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifiable on-chain transaction record
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount Hero */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Settled Amount
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {transaction.amount} CC
            </div>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Gas Fee: {transaction.fee} CC
            </div>
          </div>

          {/* Granular Field List */}
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                Transaction Hash
              </span>
              <span className="font-mono text-emerald-400 break-all font-semibold">
                {transaction.txHash}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                From Address
              </span>
              <span className="font-mono text-slate-300 break-all">
                {transaction.fromAddress}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                To Address
              </span>
              <span className="font-mono text-slate-300 break-all">
                {transaction.toAddress}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                  Block Height
                </span>
                <span className="font-mono text-white font-bold">
                  {transaction.blockHeight ? `#${transaction.blockHeight}` : "Pending Assignment"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                  Confirmations
                </span>
                <span className="font-semibold text-emerald-400">
                  {transaction.confirmations} / 3 Confirmed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Explorer CTA */}
        <div className="pt-6 border-t border-slate-800">
          <Link
            href={`/explorer/tx/${transaction.txHash}`}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>Inspect on Live Block Explorer</span>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}

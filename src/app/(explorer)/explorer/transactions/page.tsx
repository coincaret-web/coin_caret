import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getTransactions } from "@/modules/explorer/service/explorer.service";
import {
  ArrowLeftRight,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Hash,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transactions Ledger | Coin Caret Explorer",
  description: "Browse all verified transactions and double-entry settlements on the Coin Caret network.",
};

interface TransactionsPageProps {
  searchParams?: Promise<{ page?: string; limit?: string }> | { page?: string; limit?: string };
}

export default async function TransactionsPage(props: TransactionsPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = 20;

  const data = await getTransactions({ page, limit });
  const totalPages = Math.ceil(data.totalTransactions / limit) || 1;

  const formatHash = (hash: string) => {
    if (!hash || hash.length <= 16) return hash;
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const formatAddress = (addr: string) => {
    if (!addr || addr.length <= 14) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
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
    <div className="space-y-6">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/explorer"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Explorer</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                All Transactions
              </h1>
              <p className="text-xs text-slate-400">
                Total of {data.totalTransactions.toLocaleString()} transactions settled on-chain
              </p>
            </div>
          </div>
        </div>

        {/* Pagination Indicator */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>Page {data.page} of {totalPages}</span>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Tx Hash</th>
                <th className="py-3.5 px-4 sm:px-6">Block</th>
                <th className="py-3.5 px-4 sm:px-6">From</th>
                <th className="py-3.5 px-4 sm:px-6">To</th>
                <th className="py-3.5 px-4 sm:px-6">Amount</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs sm:text-sm">
              {data.transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    <Hash className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
                    No transactions found.
                  </td>
                </tr>
              ) : (
                data.transactions.map((tx) => (
                  <tr
                    key={tx?.id || tx?.txHash}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-4 px-4 sm:px-6 font-bold text-slate-200">
                      <Link
                        href={`/explorer/tx/${tx?.txHash}`}
                        className="hover:text-emerald-400 flex items-center space-x-1"
                        title={tx?.txHash}
                      >
                        <span>{formatHash(tx?.txHash || "")}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {tx?.blockHeight ? (
                        <Link
                          href={`/explorer/block/${tx.blockHeight}`}
                          className="text-cyan-400 hover:underline font-bold"
                        >
                          #{tx.blockHeight}
                        </Link>
                      ) : (
                        <span className="text-amber-400 text-xs">Mempool</span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <Link
                        href={`/explorer/address/${tx?.fromAddress}`}
                        className="text-cyan-400/90 hover:text-cyan-300 hover:underline"
                        title={tx?.fromAddress}
                      >
                        {formatAddress(tx?.fromAddress || "")}
                      </Link>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <Link
                        href={`/explorer/address/${tx?.toAddress}`}
                        className="text-cyan-400/90 hover:text-cyan-300 hover:underline"
                        title={tx?.toAddress}
                      >
                        {formatAddress(tx?.toAddress || "")}
                      </Link>
                    </td>
                    <td className="py-4 px-4 sm:px-6 font-black text-white">
                      {tx?.amount} CC
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      {getStatusBadge(tx?.status || "", tx?.confirmations || 0)}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right text-xs text-slate-400">
                      {new Date(tx?.createdAt || "").toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between">
            <Link
              href={`/explorer/transactions?page=${Math.max(1, page - 1)}`}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition-colors ${
                page <= 1
                  ? "border-slate-800 text-slate-600 pointer-events-none"
                  : "border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </Link>

            <span className="text-xs text-slate-400 font-mono">
              Page {page} of {totalPages}
            </span>

            <Link
              href={`/explorer/transactions?page=${Math.min(totalPages, page + 1)}`}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition-colors ${
                page >= totalPages
                  ? "border-slate-800 text-slate-600 pointer-events-none"
                  : "border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

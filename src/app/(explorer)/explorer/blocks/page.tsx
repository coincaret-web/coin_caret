import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { getBlocks } from "@/modules/explorer/service/explorer.service";
import { Blocks, ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blocks Stream | Coin Caret Explorer",
  description: "Browse all cryptographically sealed blocks on the Coin Caret network with real-time verification.",
};

interface BlocksPageProps {
  searchParams?: Promise<{ page?: string; limit?: string }> | { page?: string; limit?: string };
}

export default async function BlocksPage(props: BlocksPageProps) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const limit = 20;

  const data = await getBlocks({ page, limit });
  const totalPages = Math.ceil(data.totalBlocks / limit) || 1;

  const formatHash = (hash: string) => {
    if (!hash || hash.length <= 20) return hash;
    return `${hash.slice(0, 12)}...${hash.slice(-10)}`;
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
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Blocks className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                All Blocks
              </h1>
              <p className="text-xs text-slate-400">
                Total of {data.totalBlocks.toLocaleString()} sealed blocks on Coin Caret consensus
              </p>
            </div>
          </div>
        </div>

        {/* Pagination Indicator */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <span>Page {data.page} of {totalPages}</span>
        </div>
      </div>

      {/* Blocks Table Card */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 border-b border-slate-800/80 text-xs uppercase font-semibold text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Height</th>
                <th className="py-3.5 px-4 sm:px-6">Block Hash</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Txns</th>
                <th className="py-3.5 px-4 sm:px-6">Gas Settled</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data.blocks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
                    No sealed blocks found.
                  </td>
                </tr>
              ) : (
                data.blocks.map((block) => (
                  <tr
                    key={block?.id || block?.height}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    <td className="py-4 px-4 sm:px-6 font-bold text-cyan-400">
                      <Link
                        href={`/explorer/block/${block?.height}`}
                        className="hover:text-cyan-300 flex items-center space-x-1"
                      >
                        <span>#{block?.height}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-300">
                      <Link
                        href={`/explorer/block/${block?.height}`}
                        className="text-slate-300 hover:text-cyan-400 break-all"
                        title={block?.blockHash}
                      >
                        {formatHash(block?.blockHash || "")}
                      </Link>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700/60">
                        {block?.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        {block?.transactionCount} txns
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-slate-300 text-xs">
                      {block?.gasUsed} CC
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right text-xs text-slate-400">
                      {new Date(block?.createdAt || "").toLocaleTimeString()}
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
              href={`/explorer/blocks?page=${Math.max(1, page - 1)}`}
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
              href={`/explorer/blocks?page=${Math.min(totalPages, page + 1)}`}
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

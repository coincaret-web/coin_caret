"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Blocks, ArrowUpRight, Clock, CheckCircle2, ChevronRight, Layers } from "lucide-react";

export interface ExplorerBlock {
  id: string;
  height: string;
  blockHash: string;
  parentHash: string;
  merkleRoot: string;
  status: string;
  transactionCount: number;
  gasUsed: string;
  createdAt: string;
}

interface LiveBlockFeedProps {
  initialBlocks: ExplorerBlock[];
}

export function LiveBlockFeed({ initialBlocks }: LiveBlockFeedProps) {
  const [blocks, setBlocks] = useState<ExplorerBlock[]>(initialBlocks);

  // Auto-refresh blocks every 6 seconds to capture 10s block cadence
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/explorer/blocks?limit=10");
        if (res.ok) {
          const data = await res.json();
          if (data.blocks) {
            setBlocks(data.blocks);
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

  const timeAgo = (dateStr: string) => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Blocks className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Latest Blocks</h3>
            <p className="text-xs text-slate-400">Minted every 10s by consensus engine</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-xs text-cyan-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping mr-1" />
          <span>Live Feed</span>
        </div>
      </div>

      {/* Block List */}
      <div className="divide-y divide-slate-800/60 flex-1 overflow-y-auto mt-2 -mx-2 px-2">
        {blocks.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
            No blocks sealed yet. Block generator worker active.
          </div>
        ) : (
          blocks.map((block) => (
            <div
              key={block.id || block.height}
              className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 font-mono text-xs font-bold shrink-0 group-hover:border-cyan-500/40 transition-colors">
                  #{block.height}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/explorer/block/${block.height}`}
                      className="font-bold text-sm text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
                    >
                      <span>Block #{block.height}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/60">
                      {block.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5 font-mono">
                    <span title={block.blockHash}>{formatHash(block.blockHash)}</span>
                    <span>•</span>
                    <span className="text-slate-400">{timeAgo(block.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                  <span>{block.transactionCount} txns</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  {block.gasUsed} CC
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-auto border-t border-slate-800/60">
        <Link
          href="/explorer/blocks"
          className="w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center space-x-1 transition-colors border border-slate-700/50"
        >
          <span>View All Blocks</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

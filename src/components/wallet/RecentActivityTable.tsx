import React from "react";
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, AlertTriangle, ExternalLink } from "lucide-react";

export interface TransactionSummaryItem {
  id: string;
  txHash: string;
  type: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  fee: string;
  status: string;
  confirmations: number;
  blockHeight?: number | null;
  createdAt: string;
}

interface RecentActivityTableProps {
  transactions: TransactionSummaryItem[];
  currentAddress?: string;
  onSelectTx?: (tx: TransactionSummaryItem) => void;
}

export function RecentActivityTable({
  transactions,
  currentAddress,
  onSelectTx,
}: RecentActivityTableProps) {
  const getStatusBadge = (status: string, confirmations: number) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed (3/3)</span>
          </span>
        );
      case "CONFIRMING":
      case "BLOCK_ASSIGNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Confirming ({confirmations}/3)</span>
          </span>
        );
      case "IN_MEMPOOL":
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Mempool (1/3)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400">
            <span>{status}</span>
          </span>
        );
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
        <p className="text-slate-400 text-sm font-medium">No transactions recorded yet.</p>
        <p className="text-slate-500 text-xs mt-1">Initiate a transfer or receive CC to view live activity.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Recent Ledger Activity
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verifiable cryptographic transactions settled on Coin Caret
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/40 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800/80">
            <tr>
              <th className="px-6 py-4">Transaction / Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status & Finality</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {transactions.map((tx) => {
              const isOutgoing = currentAddress && tx.fromAddress.toLowerCase() === currentAddress.toLowerCase();
              return (
                <tr
                  key={tx.id}
                  onClick={() => onSelectTx && onSelectTx(tx)}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isOutgoing
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {isOutgoing ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-mono text-xs text-slate-300 font-semibold truncate max-w-[160px] sm:max-w-[220px]">
                          {tx.txHash}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">
                          {tx.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-white">
                      {tx.amount} CC
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Fee: {tx.fee} CC
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(tx.status, tx.confirmations)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTx && onSelectTx(tx);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      aria-label="View receipt"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

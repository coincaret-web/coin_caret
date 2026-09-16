import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Activity, 
  Coins, 
  Layers, 
  Users, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  Sliders, 
  FileText,
  Lock
} from "lucide-react";
import { getNetworkConfig } from "@/modules/admin/service/network-config.service";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    userCount,
    blockCount,
    pendingTxCount,
    totalTxCount,
    latestBlock,
    auditLogs,
    networkConfig,
    availableAccounts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.block.count(),
    prisma.transaction.count({ where: { status: { in: ["QUEUED", "IN_MEMPOOL"] } } }),
    prisma.transaction.count(),
    prisma.block.findFirst({ orderBy: { height: "desc" } }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { actorUser: true },
    }),
    getNetworkConfig(),
    prisma.ledgerAccount.findMany({
      where: { accountType: "AVAILABLE" },
      include: { entries: true },
    }),
  ]);

  // Compute circulating supply
  let circulatingSupply = 0;
  for (const acc of availableAccounts) {
    for (const entry of acc.entries) {
      circulatingSupply += Number(entry.credit) - Number(entry.debit);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Command Center Overview</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              MAINNET
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, double-entry treasury metrics, and institutional network status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/network"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold tracking-wide transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Network Controls</span>
          </Link>
          <Link
            href="/admin/treasury"
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-semibold tracking-wide shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Treasury Issuance</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Circulating CC */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">Circulating Supply</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {circulatingSupply.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-sm text-cyan-400 font-mono ml-1.5 font-normal">CC</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-2">
            Derived from strict zero-sum ledger
          </div>
        </div>

        {/* Sealed Height */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">Block Height</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            #{latestBlock ? latestBlock.height.toString() : "0"}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Cadence: {networkConfig.blockIntervalMs / 1000}s ({networkConfig.isNetworkPaused ? "PAUSED" : "ACTIVE"})
          </div>
        </div>

        {/* Mempool Queue */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">Mempool Backlog</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {pendingTxCount}
            <span className="text-sm text-slate-400 font-mono ml-1.5 font-normal">Txs</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-2">
            {totalTxCount} cumulative transactions
          </div>
        </div>

        {/* Provisioned Users */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-3">
            <span className="font-mono uppercase tracking-wider">Active Accounts</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {userCount}
          </div>
          <div className="text-[11px] text-indigo-400 font-mono mt-2">
            100% Cryptographic Checksummed
          </div>
        </div>
      </div>

      {/* Network Overview & Audit Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Health Card */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Network Parameters</span>
            </h2>
            <Link
              href="/admin/network"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              <span>Edit</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-400">Block Cadence</span>
              <span className="text-white font-bold">{networkConfig.blockIntervalMs / 1000} seconds</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-400">Standard Gas Fee</span>
              <span className="text-amber-400 font-bold">{networkConfig.standardFeeCc} CC</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-400">Confirmation Threshold</span>
              <span className="text-indigo-400 font-bold">{networkConfig.requiredConfirmations} Blocks</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-400">Settlement Status</span>
              <span className={networkConfig.isNetworkPaused ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                {networkConfig.isNetworkPaused ? "PAUSED" : "ACTIVE"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Audit Logs */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Immutable Audit Trail</span>
            </h2>
            <Link
              href="/admin/audit-logs"
              className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-mono">
                No audit events recorded yet.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs font-mono gap-2"
                >
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-slate-300">
                      {log.actorUser?.email || "SYSTEM"}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

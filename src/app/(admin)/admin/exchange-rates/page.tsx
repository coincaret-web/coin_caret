import { prisma } from "@/lib/prisma";
import { getAllExchangeRates } from "@/modules/market/service/exchange-rate.service";
import { ExchangeRateForm } from "@/components/admin/ExchangeRateForm";
import { ArrowLeftRight, History, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Exchange Rate Matrix | Coin Caret Admin",
  description: "Configure cross-asset exchange rate pairs, manual rate overrides, and audit trails.",
};

export default async function AdminExchangeRatesPage() {
  const [rates, auditLogs] = await Promise.all([
    getAllExchangeRates(),
    prisma.auditLog.findMany({
      where: { entityType: "AssetPairRate" },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { actorUser: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Cross-Asset Exchange Rate Matrix</h1>
            <p className="text-xs text-slate-400 font-mono">
              Manage authoritative conversion rates across all 8 supported network assets
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Matrix Form */}
        <div className="lg:col-span-2">
          <ExchangeRateForm initialRates={rates} />
        </div>

        {/* Rate Mutation Audit Trail */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Rate Adjustment Audit Log</h3>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-mono">
                No previous rate adjustments recorded.
              </div>
            ) : (
              auditLogs.map((log) => {
                const afterState = (log.afterState as any) || {};
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        {afterState.from} ➔ {afterState.to}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {afterState.rate}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                      <span>By: {log.actorUser?.email?.split("@")[0] || "SYSTEM"}</span>
                      <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { getCcUsdRate } from "@/modules/admin/service/platform-config.service";
import { PlatformConfigForm } from "@/components/admin/PlatformConfigForm";
import { KycConfigPanel } from "@/components/admin/KycConfigPanel";
import { Settings, History } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Platform Settings | Coin Caret Admin",
  description: "Manage authoritative CC/USD rates, system parameters, and global valuations.",
};

export default async function AdminSettingsPage() {
  const [rateData, kycRequiredConfig, kycReviewModeConfig, auditLogs] = await Promise.all([
    getCcUsdRate(),
    prisma.platformConfig.findUnique({ where: { key: "KYC_REQUIRED" } }),
    prisma.platformConfig.findUnique({ where: { key: "KYC_REVIEW_MODE" } }),
    prisma.auditLog.findMany({
      where: { entityType: "PLATFORM_CONFIG" },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { actorUser: true },
    }),
  ]);

  const initialKycRequired = kycRequiredConfig ? kycRequiredConfig.value === "true" : true;
  const initialKycReviewMode = (kycReviewModeConfig?.value === "manual" ? "manual" : "automatic") as "automatic" | "manual";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Platform Settings & Valuations</h1>
            <p className="text-xs text-slate-400 font-mono">
              Authoritative exchange rate feeds, compliance parameters, and institutional controls
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Forms */}
        <div className="lg:col-span-2 space-y-8">
          <PlatformConfigForm initialRate={rateData.rate} updatedAt={rateData.updatedAt} />
          <KycConfigPanel
            initialKycRequired={initialKycRequired}
            initialKycReviewMode={initialKycReviewMode}
          />
        </div>

        {/* Mutation Audit Trail */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Config Audit History</h3>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-mono">
                No previous configuration adjustments recorded.
              </div>
            ) : (
              auditLogs.map((log) => {
                const entityId = log.entityId || "CONFIG";
                const afterVal = (log.afterState as any)?.value || "—";
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {entityId}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-emerald-400">
                      Value: {afterVal}
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

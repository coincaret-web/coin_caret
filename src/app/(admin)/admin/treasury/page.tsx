import { prisma } from "@/lib/prisma";
import { TreasuryMintForm } from "@/components/admin/TreasuryMintForm";
import { Coins, History, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Treasury Issuance | Coin Caret Admin",
  description: "Mint CC tokens directly into client accounts with strict audit logging.",
};

export default async function AdminTreasuryPage() {
  const [wallets, issuances] = await Promise.all([
    prisma.wallet.findMany({
      include: {
        user: true,
        addresses: { where: { isPrimary: true } },
      },
    }),
    prisma.treasuryIssuanceRequest.findMany({
      take: 15,
      orderBy: { createdAt: "desc" },
      include: {
        requester: true,
        approver: true,
      },
    }),
  ]);

  const walletOptions = wallets
    .filter((w) => w.user && w.addresses.length > 0)
    .map((w) => ({
      id: w.id,
      label: w.label,
      address: w.addresses[0].address,
      userEmail: w.user!.email,
      userName: w.user!.displayName,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Treasury Issuance & Allocations</h1>
            <p className="text-xs text-slate-400 font-mono">
              Double-entry currency creation via SYSTEM_TREASURY reserve account
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Minting Form */}
        <div className="lg:col-span-2">
          <TreasuryMintForm wallets={walletOptions} />
        </div>

        {/* Recent Allocations List */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">Recent Issuances</h3>
          </div>

          <div className="space-y-3">
            {issuances.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-mono">
                No recent issuances found.
              </div>
            ) : (
              issuances.map((issuance) => (
                <div
                  key={issuance.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      +{Number(issuance.amount).toLocaleString()} CC
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      SETTLED
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 truncate">
                    {issuance.reason}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>By: {issuance.requester?.email?.split("@")[0]}</span>
                    <span>{new Date(issuance.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

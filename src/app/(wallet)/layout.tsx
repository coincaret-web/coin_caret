import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kycGateService } from "@/modules/kyc/service/kyc-gate.service";
import { WalletNavbar } from "@/components/wallet/WalletNavbar";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { Clock, ShieldAlert, ArrowRight, RefreshCw } from "lucide-react";

export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    redirect("/login?callbackUrl=/wallet");
  }

  const userId = (session.user as any).id;
  const accessStatus = await kycGateService.getAccessStatus(userId);

  if (accessStatus === "NEEDS_UPLOAD") {
    redirect("/verify");
  }

  if (accessStatus === "REJECTED_REUPLOAD") {
    redirect("/verify?reason=rejected");
  }

  if (accessStatus === "AWAITING_REVIEW") {
      return (
        <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
          <WalletNavbar primaryAddress="" />
          <main className="flex-1 py-12 md:py-20 flex items-center justify-center">
            <LayoutContainer>
              <div className="max-w-lg mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Identity Verification In Progress</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Compliance Desk Review</h1>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Your identity documents and SSN have been securely received and are currently undergoing manual audit by our compliance desk. Full wallet operations will be unlocked upon approval.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Protocol Queue:</span>
                    <span className="text-amber-400 font-bold">Standard Tier 1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Completion:</span>
                    <span className="text-slate-200">10 – 30 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Wallet:</span>
                    <span className="text-emerald-400 font-bold">Coin Caret Institutional</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/verify"
                    className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-amber-500/20"
                  >
                    <span>View Submission Status</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </LayoutContainer>
          </main>
          <footer className="border-t border-slate-800/80 py-8 bg-slate-950/60 text-center text-xs text-slate-500">
            <LayoutContainer>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>Coin Caret Mainnet • Protocol v1.0 • Chain ID 3847</div>
                <div>Institutional Non-Custodial Infrastructure</div>
              </div>
            </LayoutContainer>
          </footer>
        </div>
      );
    }

  const userWallet = await prisma.wallet.findFirst({
    where: { userId },
    include: { addresses: true },
  });

  const primaryAddress = userWallet?.addresses[0]?.address ?? "";

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      <WalletNavbar primaryAddress={primaryAddress} />
      <main className="flex-1 py-10 md:py-14">
        <LayoutContainer>{children}</LayoutContainer>
      </main>
      <footer className="border-t border-slate-800/80 py-8 bg-slate-950/60 text-center text-xs text-slate-500">
        <LayoutContainer>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>Coin Caret Mainnet • Protocol v1.0 • Chain ID 3847</div>
            <div>Institutional Non-Custodial Infrastructure</div>
          </div>
        </LayoutContainer>
      </footer>
    </div>
  );
}

import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WalletNavbar } from "@/components/wallet/WalletNavbar";
import { LayoutContainer } from "@/components/layout/LayoutContainer";

export default async function WalletLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !(session.user as any).id) {
    redirect("/login?callbackUrl=/wallet");
  }

  const userId = (session.user as any).id;
  const userWallet = await prisma.wallet.findFirst({
    where: { userId },
    include: { addresses: true },
  });

  const primaryAddress = userWallet?.addresses[0]?.address ?? "";

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      <WalletNavbar primaryAddress={primaryAddress} />
      <main className="flex-1 py-10 md:py-14">
        <LayoutContainer>
          {children}
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

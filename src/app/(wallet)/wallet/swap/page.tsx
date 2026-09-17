"use client";

import React, { useEffect, useState } from "react";
import { SwapForm } from "@/components/wallet/SwapForm";
import { Loader2 } from "lucide-react";

export default function SwapPage() {
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch("/api/wallet/summary");
        if (res.ok) {
          const data = await res.json();
          if (data.wallets && data.wallets.length > 0) {
            setUserAssets(
              data.wallets.map((w: any) => ({
                symbol: w.assetSymbol,
                name: w.assetName,
                availableBalance: w.availableBalance,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch user assets for swap:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Loading multi-currency asset vaults...</p>
      </div>
    );
  }

  return <SwapForm userAssets={userAssets} />;
}

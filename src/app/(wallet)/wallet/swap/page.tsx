"use client";

import React, { useEffect, useState } from "react";
import { SwapForm } from "@/components/wallet/SwapForm";
import { Loader2 } from "lucide-react";

// Fallback list in case the API call fails completely
const FALLBACK_ASSETS = [
  { symbol: "CC",   name: "Coin Caret",   availableBalance: "0.00000000" },
  { symbol: "BTC",  name: "Bitcoin",      availableBalance: "0.00000000" },
  { symbol: "ETH",  name: "Ethereum",     availableBalance: "0.00000000" },
  { symbol: "SOL",  name: "Solana",       availableBalance: "0.00000000" },
  { symbol: "BNB",  name: "BNB",          availableBalance: "0.00000000" },
  { symbol: "LTC",  name: "Litecoin",     availableBalance: "0.00000000" },
  { symbol: "XRP",  name: "XRP",          availableBalance: "0.00000000" },
  { symbol: "DOGE", name: "Dogecoin",     availableBalance: "0.00000000" },
];

export default function SwapPage() {
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        // Fetch all supported assets AND user wallet balances in parallel
        const [summaryRes, assetsRes] = await Promise.all([
          fetch("/api/wallet/summary"),
          fetch("/api/platform/assets"),
        ]);

        // Build a map of user's wallet balances keyed by asset symbol
        const walletBalanceMap: Record<string, string> = {};
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          if (Array.isArray(summaryData.wallets)) {
            for (const w of summaryData.wallets) {
              walletBalanceMap[w.assetSymbol] = w.availableBalance ?? "0.00000000";
            }
          }
        }

        // Use platform asset registry as the canonical list of all 8 assets
        let mergedAssets: any[] = [];
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          if (assetsData.success && Array.isArray(assetsData.assets)) {
            mergedAssets = assetsData.assets.map((asset: any) => ({
              symbol: asset.symbol,
              name: asset.name,
              // Merge in the user's real balance if they have a wallet for this asset
              availableBalance: walletBalanceMap[asset.symbol] ?? "0.00000000",
            }));
          }
        }

        // Fall back to static list if API returned nothing
        if (mergedAssets.length === 0) {
          mergedAssets = FALLBACK_ASSETS.map((a) => ({
            ...a,
            availableBalance: walletBalanceMap[a.symbol] ?? a.availableBalance,
          }));
        }

        // Sort: assets with a positive balance come first
        mergedAssets.sort((a: any, b: any) => {
          const aBalance = parseFloat(a.availableBalance);
          const bBalance = parseFloat(b.availableBalance);
          if (bBalance !== aBalance) return bBalance - aBalance; // descending balance
          return a.symbol.localeCompare(b.symbol); // alphabetical for ties
        });

        setUserAssets(mergedAssets);
      } catch (err) {
        console.error("Failed to fetch user assets for swap:", err);
        setUserAssets(FALLBACK_ASSETS);
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

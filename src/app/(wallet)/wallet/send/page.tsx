"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SendForm, SendWalletOption } from "@/components/wallet/SendForm";
import { Loader2 } from "lucide-react";

// Per-asset network fee defaults (mirrors fee-schedule.service.ts)
const FEE_MAP: Record<string, string> = {
  CC:   "0.50000000",
  BTC:  "0.00001500",
  ETH:  "0.00050000",
  SOL:  "0.00050000",
  BNB:  "0.00050000",
  LTC:  "0.00100000",
  XRP:  "0.10000000",
  DOGE: "1.00000000",
};

const ASSET_NAME_MAP: Record<string, string> = {
  CC:   "Coin Caret",
  BTC:  "Bitcoin",
  ETH:  "Ethereum",
  SOL:  "Solana",
  BNB:  "BNB",
  LTC:  "Litecoin",
  XRP:  "XRP",
  DOGE: "Dogecoin",
};

function SendPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Read the ?asset= query param (e.g., /wallet/send?asset=BTC)
  const initialAsset = (searchParams.get("asset") || "CC").toUpperCase();
  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [wallets, setWallets] = useState<SendWalletOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state if URL query parameter changes
  useEffect(() => {
    const urlAsset = (searchParams.get("asset") || "CC").toUpperCase();
    setSelectedAsset(urlAsset);
  }, [searchParams]);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const [summaryRes, assetsRes] = await Promise.all([
          fetch("/api/wallet/summary"),
          fetch("/api/platform/assets"),
        ]);

        const walletMap: Record<string, any> = {};
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          if (Array.isArray(summaryData.wallets)) {
            for (const w of summaryData.wallets) {
              walletMap[w.assetSymbol?.toUpperCase()] = w;
            }
          }
        }

        const SUPPORTED = ["CC", "BTC", "ETH", "SOL", "BNB", "LTC", "XRP", "DOGE"];
        let assetList = SUPPORTED;
        if (assetsRes.ok) {
          const assetsData = await assetsRes.json();
          if (assetsData.success && Array.isArray(assetsData.assets)) {
            assetList = assetsData.assets.map((a: any) => a.symbol.toUpperCase());
          }
        }

        const formatted: SendWalletOption[] = assetList.map((sym: string) => {
          const w = walletMap[sym];
          return {
            symbol: sym,
            name: ASSET_NAME_MAP[sym] || w?.assetName || sym,
            address: w?.address || "",
            walletId: w?.walletId || "",
            availableBalance: w?.availableBalance || "0.00000000",
            networkFee: FEE_MAP[sym] || "0.00100000",
          };
        });

        setWallets(formatted);
      } catch (err) {
        console.error("Error fetching wallet summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallets();
  }, []);


  const handleSelectAsset = (symbol: string) => {
    const upper = symbol.toUpperCase();
    setSelectedAsset(upper);
    router.replace(`/wallet/send?asset=${upper}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">
          Loading {selectedAsset} wallet balance and gas parameters...
        </p>
      </div>
    );
  }

  const activeWallet = wallets.find((w) => w.symbol === selectedAsset) || wallets[0] || {
    symbol: selectedAsset,
    name: ASSET_NAME_MAP[selectedAsset] || selectedAsset,
    address: "",
    walletId: "",
    availableBalance: "0.00000000",
    networkFee: FEE_MAP[selectedAsset] || "0.50000000",
  };

  return (
    <SendForm
      availableBalance={activeWallet.availableBalance}
      senderAddress={activeWallet.address || ""}
      assetSymbol={activeWallet.symbol}
      assetName={activeWallet.name}
      walletId={activeWallet.walletId}
      networkFee={activeWallet.networkFee}
      wallets={wallets}
      onSelectAsset={handleSelectAsset}
    />
  );
}

export default function SendPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Loading wallet balance and gas parameters...
          </p>
        </div>
      }
    >
      <SendPageInner />
    </Suspense>
  );
}


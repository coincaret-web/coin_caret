"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ReceiveCard, ReceiveWalletOption } from "@/components/wallet/ReceiveCard";
import { Loader2 } from "lucide-react";

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

function ReceivePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read the ?asset= query param (e.g., /wallet/receive?asset=BTC)
  const initialAsset = (searchParams.get("asset") || "CC").toUpperCase();
  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [wallets, setWallets] = useState<ReceiveWalletOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state if URL query parameter changes
  useEffect(() => {
    const urlAsset = (searchParams.get("asset") || "CC").toUpperCase();
    setSelectedAsset(urlAsset);
  }, [searchParams]);

  useEffect(() => {
    const fetchAssetWallets = async () => {
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

        const formatted: ReceiveWalletOption[] = assetList.map((sym: string) => {
          const w = walletMap[sym];
          return {
            symbol: sym,
            name: ASSET_NAME_MAP[sym] || w?.assetName || sym,
            address: w?.address || `${sym}0x0000000000000000000000000000000000000000`,
          };
        });

        setWallets(formatted);
      } catch (err) {
        console.error("Error fetching wallet addresses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssetWallets();
  }, []);


  const handleSelectAsset = (symbol: string) => {
    const upper = symbol.toUpperCase();
    setSelectedAsset(upper);
    router.replace(`/wallet/receive?asset=${upper}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">
          Retrieving {selectedAsset} deposit address...
        </p>
      </div>
    );
  }

  const activeWallet = wallets.find((w) => w.symbol === selectedAsset) || wallets[0] || {
    symbol: selectedAsset,
    name: ASSET_NAME_MAP[selectedAsset] || selectedAsset,
    address: `${selectedAsset}0x0000000000000000000000000000000000000000`,
  };

  return (
    <ReceiveCard
      address={activeWallet.address || `${activeWallet.symbol}0x0000000000000000000000000000000000000000`}
      assetSymbol={activeWallet.symbol}
      assetName={activeWallet.name}
      networkName="Coin Caret Mainnet"
      chainId={3847}
      wallets={wallets}
      onSelectAsset={handleSelectAsset}
    />
  );
}

export default function ReceivePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Retrieving deposit address...</p>
        </div>
      }
    >
      <ReceivePageInner />
    </Suspense>
  );
}


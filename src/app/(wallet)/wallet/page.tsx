"use client";

import React, { useEffect, useState } from "react";
import { BalanceOverviewCard } from "@/components/wallet/BalanceOverviewCard";
import { PortfolioChart } from "@/components/wallet/PortfolioChart";
import { CryptoConversionCalculator } from "@/components/wallet/CryptoConversionCalculator";
import { RecentActivityTable, TransactionSummaryItem } from "@/components/wallet/RecentActivityTable";
import { TransactionDrawer } from "@/components/wallet/TransactionDrawer";
import { PortfolioDashboard } from "@/components/wallet/PortfolioDashboard";
import { Loader2, Layers, Coins } from "lucide-react";

export default function WalletDashboardPage() {
  const [activeTab, setActiveTab] = useState<"PORTFOLIO" | "CC_MAINNET">("PORTFOLIO");
  const [summary, setSummary] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [usdRate, setUsdRate] = useState<string>("0.25");
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<TransactionSummaryItem | null>(null);

  const fetchData = async () => {
    try {
      const [summaryRes, portfolioRes, rateRes] = await Promise.all([
        fetch("/api/wallet/summary"),
        fetch("/api/wallet/portfolio"),
        fetch("/api/platform/cc-usd-rate"),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      if (portfolioRes.ok) {
        const portJson = await portfolioRes.json();
        if (portJson.success) {
          setPortfolioData(portJson.portfolio);
        }
      }

      if (rateRes.ok) {
        const rateData = await rateRes.json();
        setUsdRate(rateData.rate || "0.25");
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); // Live poll for 10s block assignments
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary && !portfolioData) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">Synchronizing multi-currency blockchain ledgers...</p>
      </div>
    );
  }

  const available = summary?.availableBalance || "0.00000000";
  const reserved = summary?.reservedBalance || "0.00000000";
  const total = summary?.totalBalance || "0.00000000";
  const address = summary?.address || "";
  const transactions = summary?.transactions || [];

  return (
    <div className="space-y-8">
      {/* Surface Mode Toggle Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex bg-slate-900/80 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("PORTFOLIO")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "PORTFOLIO"
                ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Multi-Asset Portfolio</span>
          </button>
          <button
            onClick={() => setActiveTab("CC_MAINNET")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "CC_MAINNET"
                ? "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>CC Native Mainnet</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Multi-Currency Portfolio Dashboard */}
      {activeTab === "PORTFOLIO" && (
        <PortfolioDashboard
          assets={portfolioData?.assets || []}
          totalPortfolioUsdValue={portfolioData?.totalPortfolioUsdValue || "0.00"}
          isStale={portfolioData?.isStale}
        />
      )}

      {/* Tab 2: CC Mainnet Vault Deep Dive */}
      {activeTab === "CC_MAINNET" && (
        <div className="space-y-10">
          <BalanceOverviewCard
            availableBalance={available}
            reservedBalance={reserved}
            totalBalance={total}
            assetSymbol="CC"
            primaryAddress={address}
            usdRate={usdRate}
          />

          <PortfolioChart
            currentBalance={total}
            primaryAddress={address}
            transactions={transactions}
          />

          <CryptoConversionCalculator initialCcAmount={available} />
        </div>
      )}

      {/* Real-Time Transactions Feed */}
      <RecentActivityTable
        transactions={transactions}
        currentAddress={address}
        onSelectTx={(tx) => setSelectedTx(tx)}
      />

      {/* Slide-out Transaction Receipt Inspector */}
      <TransactionDrawer
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { BalanceOverviewCard } from "@/components/wallet/BalanceOverviewCard";
import { PortfolioChart } from "@/components/wallet/PortfolioChart";
import { RecentActivityTable, TransactionSummaryItem } from "@/components/wallet/RecentActivityTable";
import { TransactionDrawer } from "@/components/wallet/TransactionDrawer";
import { Loader2 } from "lucide-react";

export default function WalletDashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<TransactionSummaryItem | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/wallet/summary");
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Error fetching wallet summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 8000); // Live poll for 10s block assignments
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Synchronizing on-chain ledger balances...</p>
      </div>
    );
  }

  const available = summary?.availableBalance || "0.00000000";
  const reserved = summary?.reservedBalance || "0.00000000";
  const total = summary?.totalBalance || "0.00000000";
  const address = summary?.address || "";
  const transactions = summary?.transactions || [];

  return (
    <div className="space-y-10">
      {/* 1. Balances & Actions */}
      <BalanceOverviewCard
        availableBalance={available}
        reservedBalance={reserved}
        totalBalance={total}
        assetSymbol="CC"
        primaryAddress={address}
      />

      {/* 2. Portfolio Performance Chart */}
      <PortfolioChart
        currentBalance={total}
        primaryAddress={address}
        transactions={transactions}
      />

      {/* 3. Recent Transactions Feed */}
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

"use client";

import React, { useEffect, useState } from "react";
import { SendForm } from "@/components/wallet/SendForm";
import { Loader2 } from "lucide-react";

export default function SendPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/wallet/summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Error fetching summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading && !summary) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading wallet balance and gas parameters...</p>
      </div>
    );
  }

  return (
    <SendForm
      availableBalance={summary?.availableBalance || "0.00000000"}
      senderAddress={summary?.address || ""}
    />
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { ReceiveCard } from "@/components/wallet/ReceiveCard";
import { Loader2 } from "lucide-react";

export default function ReceivePage() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await fetch("/api/wallet/summary");
        if (res.ok) {
          const data = await res.json();
          setAddress(data.address);
        }
      } catch (err) {
        console.error("Error fetching address:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, []);

  if (loading && !address) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Retrieving verified deposit address...</p>
      </div>
    );
  }

  return (
    <ReceiveCard
      address={address || "CC0x4f8a92b3c7e1d5a890123456789abcdef0123456"}
      networkName="Coin Caret Mainnet"
      chainId={3847}
    />
  );
}

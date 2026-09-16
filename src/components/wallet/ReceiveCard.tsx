"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, ShieldCheck, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ReceiveCardProps {
  address: string;
  networkName?: string;
  chainId?: number;
}

export function ReceiveCard({
  address,
  networkName = "Coin Caret Mainnet",
  chainId = 3847,
}: ReceiveCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/wallet"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Native CC Asset
        </span>
      </div>

      <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-2xl shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Receive Coin Caret (CC)
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-8">
          Scan QR code or copy your verifiable cryptographic address below to receive instant transfers.
        </p>

        {/* High-contrast QR Code Frame */}
        <div className="inline-block p-4 rounded-2xl bg-white shadow-2xl mb-8">
          <QRCodeSVG
            value={address}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Address Container */}
        <div className="mb-8">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Your CC0x Deposit Address
          </label>
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-left">
            <span className="font-mono text-xs sm:text-sm text-emerald-400 font-bold break-all">
              {address}
            </span>
          </div>
        </div>

        {/* Copy CTA */}
        <button
          onClick={handleCopy}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-slate-950 font-bold" />
              <span>Address Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Address</span>
            </>
          )}
        </button>

        {/* Safety Specification Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-left text-xs">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Network</span>
            <span className="text-slate-300 font-semibold">{networkName}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Chain ID</span>
            <span className="text-slate-300 font-mono font-semibold">{chainId}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

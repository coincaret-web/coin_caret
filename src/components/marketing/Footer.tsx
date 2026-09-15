import React from "react";
import Link from "next/link";
import { LayoutContainer } from "@/components/layout/LayoutContainer";
import { Shield, ArrowUpRight, Activity } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-16 text-slate-400 text-sm">
      <LayoutContainer>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-slate-950 text-sm">
                CC
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">COIN CARET</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Institutional-grade digital currency network and high-throughput cryptographic double-entry ledger platform.
            </p>
            <div className="inline-flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Network Status: Operational</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ecosystem</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/wallet" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  CC Web Wallet
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link href="/explorer" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  Block Explorer
                  <ArrowUpRight className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link href="/wallet/send" className="hover:text-emerald-400 transition-colors">
                  Send CC
                </Link>
              </li>
              <li>
                <Link href="/wallet/receive" className="hover:text-emerald-400 transition-colors">
                  Receive CC
                </Link>
              </li>
              <li>
                <Link href="/wallet/withdraw" className="hover:text-emerald-400 transition-colors">
                  Institutional Withdrawals
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Protocol & Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Protocol</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#architecture" className="hover:text-emerald-400 transition-colors">
                  10s Block Minting Engine
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-emerald-400 transition-colors">
                  Double-Entry Ledger Invariance
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-emerald-400 transition-colors">
                  3-Tier Confirmation Finality
                </a>
              </li>
              <li>
                <span className="text-slate-600 cursor-not-allowed">
                  SHA-256 Merkle Verification
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Network Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Network Specs</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Chain ID</span>
                <span className="text-slate-300 font-mono">3847</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Block Cadence</span>
                <span className="text-slate-300 font-mono">10.0s</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-500">Address Format</span>
                <span className="text-slate-300 font-mono">CC0x... (40 Hex)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Precision</span>
                <span className="text-slate-300 font-mono">8 Decimals</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
          <div className="flex items-center space-x-2">
            <span>© {new Date().getFullYear()} Coin Caret Platform Foundation. All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-6 text-slate-500">
            <span className="hover:text-slate-400 cursor-pointer">Security Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Ledger Specification</span>
            <span className="hover:text-slate-400 cursor-pointer">API Documentation</span>
          </div>
        </div>
      </LayoutContainer>
    </footer>
  );
}

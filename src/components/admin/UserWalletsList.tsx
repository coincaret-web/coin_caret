import React from "react";
import { AdminUserWallet } from "@/types/user";
import { Wallet, Shield } from "lucide-react";

interface UserWalletsListProps {
  wallets: AdminUserWallet[];
}

export function UserWalletsList({ wallets }: UserWalletsListProps) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
            Provisioned Multi-Asset Wallets
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Total: <strong className="text-white">{wallets.length}</strong>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Asset</th>
              <th className="py-2.5 px-3">Cryptographic Address</th>
              <th className="py-2.5 px-3 text-right">Available Balance</th>
              <th className="py-2.5 px-3 text-right">Reserved (Mempool)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {wallets.map((w) => (
              <tr key={w.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{w.assetSymbol}</span>
                    <span className="text-slate-400 text-[11px]">({w.assetName})</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-[140px]">
                  {w.address || "Pending Genesis"}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                  {w.availableBalance}
                </td>
                <td className="py-3 px-3 text-right text-slate-400">
                  {w.reservedBalance}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

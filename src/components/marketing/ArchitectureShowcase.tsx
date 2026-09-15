import React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Database, Layers, ArrowLeftRight } from "lucide-react";

export function ArchitectureShowcase() {
  const steps = [
    {
      step: "01",
      title: "Mempool Ingestion & Balance Locking",
      desc: "User submits transaction. System calculates 0.0005 CC network gas fee, validates SHA-256 recipient checksum, and atomically locks funds in RESERVED_PENDING ledger accounts.",
      icon: ArrowLeftRight,
      tag: "1/3 Confirmed",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      step: "02",
      title: "Autonomous 10s Block Minting",
      desc: "Background worker selects queued mempool transactions, computes synthetic Merkle root, calculates cryptographic SHA-256 block hash, and chains with previous block parent hash.",
      icon: Layers,
      tag: "2/3 Block Assigned",
      badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    },
    {
      step: "03",
      title: "Zero-Sum Settlement & Explorer Finality",
      desc: "Upon confirmation #3, sender reserved funds are burned, recipient available account is credited, network fee is routed to Treasury, and terminal confirmation is published on the Explorer.",
      icon: ShieldCheck,
      tag: "3/3 Confirmed Final",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
  ];

  return (
    <section id="architecture" className="py-24 border-t border-slate-800/80 relative">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-4">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cryptographic Pipeline</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          How Transactions Settle on Coin Caret
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400">
          A transparent, 3-tier lifecycle backed by deterministic double-entry accounting guarantees zero double-spends and total immutability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-black text-slate-700">{item.step}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                    {item.tag}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Deterministic Ledger Invariant</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

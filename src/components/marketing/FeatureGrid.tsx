import React from "react";
import { Shield, Scale, Clock, Lock, Cpu, ArrowLeftRight } from "lucide-react";

export function FeatureGrid() {
  const features = [
    {
      title: "Mathematical Double-Entry",
      description:
        "Every atomic transaction balances exactly to zero (∑ Debits == ∑ Credits). Zero float drift, zero phantom funds, and absolute balance invariance.",
      icon: Scale,
      gradient: "from-emerald-500/20 to-teal-500/5",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400 bg-emerald-500/10",
    },
    {
      title: "3-Tier Block Finality",
      description:
        "Transparent confirmation lifecycle (1/3 Mempool Locked ➔ 2/3 Block Assigned ➔ 3/3 Settled) providing deterministic irreversibility.",
      icon: Shield,
      gradient: "from-cyan-500/20 to-blue-500/5",
      border: "border-cyan-500/30",
      iconColor: "text-cyan-400 bg-cyan-500/10",
    },
    {
      title: "10-Second Block Times",
      description:
        "Autonomous high-throughput block minting worker packaging pending mempool entries into SHA-256 cryptographically sealed blocks.",
      icon: Clock,
      gradient: "from-teal-500/20 to-emerald-500/5",
      border: "border-teal-500/30",
      iconColor: "text-teal-400 bg-teal-500/10",
    },
    {
      title: "Sub-Cent Network Fees",
      description:
        "Predictable, ultra-low 0.0005 CC network gas fee structure with dynamic routing into protocol treasury pools.",
      icon: ArrowLeftRight,
      gradient: "from-indigo-500/20 to-purple-500/5",
      border: "border-indigo-500/30",
      iconColor: "text-indigo-400 bg-indigo-500/10",
    },
    {
      title: "Cryptographic Checksums",
      description:
        "CC0x format addresses verified with SHA-256 mixed-case checksums to guarantee zero transfer typos and total address safety.",
      icon: Lock,
      gradient: "from-amber-500/20 to-yellow-500/5",
      border: "border-amber-500/30",
      iconColor: "text-amber-400 bg-amber-500/10",
    },
    {
      title: "Synthetic Merkle Roots",
      description:
        "Every block encapsulates an immutable cryptographic Merkle tree root for instant, verifiable transaction proof validation on the public explorer.",
      icon: Cpu,
      gradient: "from-purple-500/20 to-pink-500/5",
      border: "border-purple-500/30",
      iconColor: "text-purple-400 bg-purple-500/10",
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Core Protocol Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Engineered for Institutional Rigor & Velocity
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-400">
          The Coin Caret blockchain engine fuses bank-grade accounting precision with next-generation Web3 settlement speed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={idx}
              className={`p-8 rounded-2xl bg-gradient-to-b ${feature.gradient} bg-slate-900/40 border ${feature.border} backdrop-blur-xl hover:translate-y-[-2px] transition-all group`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.iconColor}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight mb-3 group-hover:text-emerald-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

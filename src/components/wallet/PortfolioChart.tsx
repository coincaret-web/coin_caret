"use client";

import React, { useMemo } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

export interface PortfolioTransactionItem {
  id?: string;
  amount: string;
  fee?: string;
  type?: string;
  fromAddress?: string | null;
  toAddress?: string | null;
  createdAt: string;
  status: string;
}

export interface PortfolioChartProps {
  currentBalance: number | string;
  primaryAddress?: string;
  transactions?: PortfolioTransactionItem[];
}

function formatShortTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Tx";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  } catch {
    return "Tx";
  }
}

export function PortfolioChart({
  currentBalance,
  primaryAddress = "",
  transactions = [],
}: PortfolioChartProps) {
  const numericBalance = typeof currentBalance === "string" ? parseFloat(currentBalance) || 0 : currentBalance;

  // Derive authentic chronological balance trajectory from transactions
  const { data, deltaPercentage, isPositive } = useMemo(() => {
    // Filter valid transactions
    const validTxs = transactions.filter(
      (tx) => tx.status !== "FAILED" && tx.status !== "REJECTED"
    );

    if (validTxs.length === 0) {
      // Flat baseline when no transactions exist
      return {
        data: [
          { time: "24h ago", value: numericBalance },
          { time: "12h ago", value: numericBalance },
          { time: "Now", value: numericBalance },
        ],
        deltaPercentage: "+0.00% (24h)",
        isPositive: true,
      };
    }

    // Sort chronologically ascending (oldest first)
    const sortedTxs = [...validTxs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate net delta per transaction
    const netDeltas = sortedTxs.map((tx) => {
      const amt = parseFloat(tx.amount) || 0;
      const fee = parseFloat(tx.fee || "0") || 0;
      const isIncoming =
        (tx.toAddress && primaryAddress && tx.toAddress.toLowerCase() === primaryAddress.toLowerCase()) ||
        tx.type === "EXTERNAL_DEPOSIT" ||
        tx.type === "AIRDROP";
      const isOutgoing =
        (tx.fromAddress && primaryAddress && tx.fromAddress.toLowerCase() === primaryAddress.toLowerCase()) ||
        tx.type === "EXTERNAL_WITHDRAWAL";

      if (isIncoming && !isOutgoing) {
        return amt;
      } else if (isOutgoing && !isIncoming) {
        return -(amt + fee);
      } else if (tx.toAddress && !tx.fromAddress) {
        return amt;
      } else if (tx.fromAddress && !tx.toAddress) {
        return -(amt + fee);
      }
      return amt; // default positive credit if direction is unknown
    });

    // Walk backwards from current balance to compute historical balances
    const balancesAfterTx: number[] = new Array(sortedTxs.length);
    let running = numericBalance;

    for (let i = sortedTxs.length - 1; i >= 0; i--) {
      balancesAfterTx[i] = Number(running.toFixed(8));
      running = running - netDeltas[i];
    }

    const initialBalance = Math.max(0, Number(running.toFixed(8)));

    // Construct plot points
    const points = [
      {
        time: "Start",
        value: initialBalance,
        label: "Initial Balance",
      },
    ];

    sortedTxs.forEach((tx, idx) => {
      points.push({
        time: formatShortTime(tx.createdAt),
        value: balancesAfterTx[idx],
        label: `${netDeltas[idx] >= 0 ? "+" : ""}${netDeltas[idx].toFixed(2)} CC`,
      });
    });

    points.push({
      time: "Now",
      value: numericBalance,
      label: "Current Balance",
    });

    // Calculate percentage change
    let delta = 0;
    if (initialBalance > 0) {
      delta = ((numericBalance - initialBalance) / initialBalance) * 100;
    } else if (numericBalance > 0) {
      delta = 100;
    }

    const sign = delta >= 0 ? "+" : "";

    return {
      data: points,
      deltaPercentage: `${sign}${delta.toFixed(2)}% (24h)`,
      isPositive: delta >= 0,
    };
  }, [numericBalance, primaryAddress, transactions]);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            24H Portfolio Performance
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ledger asset valuation
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              isPositive
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-rose-400 bg-rose-500/10 border-rose-500/20"
            }`}
          >
            {deltaPercentage}
          </span>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#10B981" : "#F43F5E"} stopOpacity={0.4} />
                <stop offset="95%" stopColor={isPositive ? "#10B981" : "#F43F5E"} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 })} CC`}
              domain={["auto", "auto"]}
              width={75}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0F172A",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                fontSize: "12px",
                color: "#F8FAFC",
              }}
              formatter={(value: any) => [
                `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })} CC`,
                "Portfolio Balance",
              ]}
              labelFormatter={(label: any, payload: any[]) => {
                if (payload && payload[0]?.payload?.label) {
                  return `${label} (${payload[0].payload.label})`;
                }
                return label;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? "#10B981" : "#F43F5E"}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorBalance)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

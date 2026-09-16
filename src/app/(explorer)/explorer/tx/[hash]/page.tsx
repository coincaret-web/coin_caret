import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTransactionDetails } from "@/modules/explorer/service/explorer.service";
import { TransactionDetailView } from "@/components/explorer/TransactionDetailView";

export const dynamic = "force-dynamic";

interface TxPageProps {
  params: { hash: string };
}

export async function generateMetadata({ params }: TxPageProps): Promise<Metadata> {
  const hash = params.hash;
  return {
    title: `Transaction ${hash.slice(0, 12)}... | Coin Caret Explorer`,
    description: `Inspect on-chain details, gas fee, confirmations, and settlement status for transaction ${hash}.`,
  };
}

export default async function TransactionPage({ params }: TxPageProps) {
  const hash = params.hash;
  const tx = await getTransactionDetails(hash);

  if (!tx) {
    notFound();
  }

  return <TransactionDetailView tx={tx} />;
}

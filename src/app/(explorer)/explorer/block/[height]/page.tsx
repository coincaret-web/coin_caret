import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlockDetails } from "@/modules/explorer/service/explorer.service";
import { BlockDetailView } from "@/components/explorer/BlockDetailView";

export const dynamic = "force-dynamic";

interface BlockPageProps {
  params: { height: string };
}

export async function generateMetadata({ params }: BlockPageProps): Promise<Metadata> {
  const height = params.height;
  return {
    title: `Block #${height} | Coin Caret Explorer`,
    description: `Inspect block hash, Merkle tree root, parent block, gas consumption, and packaged transactions for block #${height}.`,
  };
}

export default async function BlockPage({ params }: BlockPageProps) {
  const height = params.height;
  const block = await getBlockDetails(height);

  if (!block) {
    notFound();
  }

  return <BlockDetailView block={block} />;
}

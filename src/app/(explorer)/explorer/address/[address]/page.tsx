import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAddressDetails } from "@/modules/explorer/service/explorer.service";
import { AddressDetailView } from "@/components/explorer/AddressDetailView";

export const dynamic = "force-dynamic";

interface AddressPageProps {
  params: { address: string };
  searchParams?: { page?: string };
}

export async function generateMetadata({ params }: AddressPageProps): Promise<Metadata> {
  const address = params.address;
  return {
    title: `Address ${address.slice(0, 10)}... | Coin Caret Explorer`,
    description: `Inspect on-chain portfolio balance, inflows, outflows, and transaction history for address ${address}.`,
  };
}

export default async function AddressPage({ params }: AddressPageProps) {
  const address = params.address;
  const data = await getAddressDetails(address);

  if (!data) {
    notFound();
  }

  return <AddressDetailView data={data} />;
}

import { prisma } from "@/lib/prisma";

export async function getNetworkSetting(key: string) {
  return prisma.networkSetting.findUnique({
    where: { key },
  });
}

export async function getAllNetworkSettings() {
  return prisma.networkSetting.findMany({
    orderBy: { key: "asc" },
  });
}

export async function upsertNetworkSetting(key: string, value: string, description?: string) {
  return prisma.networkSetting.upsert({
    where: { key },
    update: {
      value,
      ...(description !== undefined ? { description } : {}),
    },
    create: {
      key,
      value,
      description,
    },
  });
}

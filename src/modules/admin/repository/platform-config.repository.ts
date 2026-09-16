import { prisma } from "@/lib/prisma";

export async function findPlatformConfigByKey(key: string) {
  return prisma.platformConfig.findUnique({
    where: { key },
  });
}

export async function findAllPlatformConfigs() {
  return prisma.platformConfig.findMany({
    orderBy: { key: "asc" },
  });
}

export async function upsertPlatformConfig(
  key: string,
  value: string,
  updatedByUserId?: string | null,
  description?: string
) {
  return prisma.platformConfig.upsert({
    where: { key },
    update: {
      value,
      ...(updatedByUserId !== undefined ? { updatedByUserId } : {}),
      ...(description !== undefined ? { description } : {}),
    },
    create: {
      key,
      value,
      updatedByUserId: updatedByUserId || null,
      description: description || null,
    },
  });
}

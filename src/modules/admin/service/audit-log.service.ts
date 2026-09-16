import { prisma } from "@/lib/prisma";

export async function getAuditLogs(options?: {
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const where: any = {};
  if (options?.action) where.action = options.action;
  if (options?.entityType) where.entityType = options.entityType;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        actorUser: {
          select: { id: true, email: true, displayName: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, limit, offset };
}

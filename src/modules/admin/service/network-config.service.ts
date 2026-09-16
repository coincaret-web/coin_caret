import { prisma } from "@/lib/prisma";
import { getAllNetworkSettings, upsertNetworkSetting } from "../repository/network-config.repository";

export interface NetworkConfigState {
  blockIntervalMs: number;
  standardFeeCc: string;
  isNetworkPaused: boolean;
  requiredConfirmations: number;
}

export const DEFAULT_NETWORK_CONFIG: NetworkConfigState = {
  blockIntervalMs: 10000,
  standardFeeCc: "0.50000000",
  isNetworkPaused: false,
  requiredConfirmations: 3,
};

export async function getNetworkConfig(): Promise<NetworkConfigState> {
  const settings = await getAllNetworkSettings();
  const configMap = new Map(settings.map((s) => [s.key, s.value]));

  return {
    blockIntervalMs: configMap.has("BLOCK_INTERVAL_MS")
      ? Number(configMap.get("BLOCK_INTERVAL_MS"))
      : DEFAULT_NETWORK_CONFIG.blockIntervalMs,
    standardFeeCc: configMap.get("STANDARD_FEE_CC") ?? DEFAULT_NETWORK_CONFIG.standardFeeCc,
    isNetworkPaused: configMap.has("NETWORK_PAUSED")
      ? configMap.get("NETWORK_PAUSED") === "true"
      : DEFAULT_NETWORK_CONFIG.isNetworkPaused,
    requiredConfirmations: configMap.has("REQUIRED_CONFIRMATIONS")
      ? Number(configMap.get("REQUIRED_CONFIRMATIONS"))
      : DEFAULT_NETWORK_CONFIG.requiredConfirmations,
  };
}

export async function updateNetworkConfig(
  updates: Partial<NetworkConfigState>,
  actorUserId?: string,
  ipAddress?: string
): Promise<NetworkConfigState> {
  const beforeState = await getNetworkConfig();

  // Input validation
  if (updates.blockIntervalMs !== undefined) {
    if (isNaN(updates.blockIntervalMs) || updates.blockIntervalMs < 1000 || updates.blockIntervalMs > 60000) {
      throw new Error("Block interval must be between 1,000ms (1s) and 60,000ms (60s).");
    }
    await upsertNetworkSetting(
      "BLOCK_INTERVAL_MS",
      String(updates.blockIntervalMs),
      "Block minting ticker cadence in milliseconds"
    );
  }

  if (updates.standardFeeCc !== undefined) {
    const feeNum = Number(updates.standardFeeCc);
    if (isNaN(feeNum) || feeNum < 0 || feeNum > 100) {
      throw new Error("Standard fee must be a valid non-negative number between 0 and 100 CC.");
    }
    await upsertNetworkSetting(
      "STANDARD_FEE_CC",
      Number(updates.standardFeeCc).toFixed(8),
      "Standard transfer gas fee in CC"
    );
  }

  if (updates.isNetworkPaused !== undefined) {
    await upsertNetworkSetting(
      "NETWORK_PAUSED",
      String(updates.isNetworkPaused),
      "Emergency network settlement pause toggle"
    );
  }

  if (updates.requiredConfirmations !== undefined) {
    if (isNaN(updates.requiredConfirmations) || updates.requiredConfirmations < 1 || updates.requiredConfirmations > 10) {
      throw new Error("Required confirmations must be between 1 and 10.");
    }
    await upsertNetworkSetting(
      "REQUIRED_CONFIRMATIONS",
      String(updates.requiredConfirmations),
      "Number of confirmations required for final settlement"
    );
  }

  const afterState = await getNetworkConfig();

  // Create immutable AuditLog
  await prisma.auditLog.create({
    data: {
      actorUserId: actorUserId ?? null,
      action: "UPDATE_NETWORK_CONFIG",
      entityType: "NETWORK_SETTING",
      entityId: "NETWORK_GLOBAL",
      beforeState: beforeState as any,
      afterState: afterState as any,
      ipAddress: ipAddress ?? null,
    },
  });

  return afterState;
}

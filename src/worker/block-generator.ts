import { mintNextBlock } from "@/modules/network/service/block.service";
import { advanceConfirmations } from "@/modules/network/service/confirmation.service";
import { getNetworkConfig } from "@/modules/admin/service/network-config.service";

let isRunning = false;

export async function runBlockGenerationCycle() {
  if (isRunning) return;
  isRunning = true;

  try {
    const config = await getNetworkConfig();
    if (config.isNetworkPaused) {
      console.log("[Block Engine] Network settlement is PAUSED by administrator. Skipping block cycle.");
      return;
    }

    // 1. Advance existing unconfirmed transactions
    const confirmationResult = await advanceConfirmations(config.requiredConfirmations);

    // 2. Mint next block with pending transactions from Mempool
    const newBlock = await mintNextBlock();

    console.log(
      `[Block Engine] Block #${newBlock.height} sealed | Hash: ${newBlock.blockHash.slice(0, 10)}... | Txs: ${newBlock.transactionCount} | Confirmations Advanced: ${confirmationResult.advancedCount}`
    );
  } catch (error) {
    console.error("[Block Engine Error]", error);
  } finally {
    isRunning = false;
  }
}

// Adaptive interval worker loop
async function startAdaptiveWorkerLoop() {
  console.log("[Block Generator Worker Started] Adaptive network cadence active...");
  
  while (true) {
    let intervalMs = 10000;
    try {
      const config = await getNetworkConfig();
      intervalMs = config.blockIntervalMs;
    } catch {
      // fallback
    }
    
    await runBlockGenerationCycle();
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

// If executed directly as a standalone process
if (require.main === module) {
  startAdaptiveWorkerLoop().catch(console.error);
}


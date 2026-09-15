import { mintNextBlock } from "@/modules/network/service/block.service";
import { advanceConfirmations } from "@/modules/network/service/confirmation.service";

const intervalMs = Number(process.env.BLOCK_INTERVAL_MS ?? "10000");
const requiredConfirmations = Number(process.env.REQUIRED_CONFIRMATIONS ?? "3");

let isRunning = false;

export async function runBlockGenerationCycle() {
  if (isRunning) return;
  isRunning = true;

  try {
    // 1. Advance existing unconfirmed transactions
    const confirmationResult = await advanceConfirmations(requiredConfirmations);

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

// If executed directly as a standalone process
if (require.main === module) {
  console.log(`[Block Generator Worker Started] Polling every ${intervalMs}ms...`);
  setInterval(runBlockGenerationCycle, intervalMs);
}

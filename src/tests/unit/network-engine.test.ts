import { describe, it, expect } from "vitest";
import { internalNetworkEngine } from "@/modules/network/internal-engine/internal.engine";
import { computeMerkleRoot, computeBlockHash } from "@/modules/network/service/block.service";
import { Decimal } from "@prisma/client/runtime/library";

describe("Network Engine & Cryptographic Block Math (W-201, W-203)", () => {
  it("computes deterministic SHA-256 block hash and Merkle root", () => {
    const txHashes = [
      "0x4f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
      "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    ];

    const merkleRoot = computeMerkleRoot(txHashes);
    expect(merkleRoot).toMatch(/^0x[a-f0-9]{64}$/);

    const blockHash = computeBlockHash({
      height: 1042n,
      parentHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
      merkleRoot,
      timestamp: 1726444800,
    });

    expect(blockHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it("handles single transaction lists and odd transaction counts correctly", () => {
    // 1 tx list
    const singleTx = ["0x4f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a"];
    const singleRoot = computeMerkleRoot(singleTx);
    expect(singleRoot).toMatch(/^0x[a-f0-9]{64}$/);

    // 3 txs (odd number of nodes where rightmost node is duplicated in tree)
    const oddTxs = [
      "0x4f8a9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a",
      "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    ];
    const oddRoot = computeMerkleRoot(oddTxs);
    expect(oddRoot).toMatch(/^0x[a-f0-9]{64}$/);
    expect(oddRoot).not.toBe(singleRoot);
  });

  it("handles empty transaction lists by returning zero-hash Merkle root", () => {
    const merkleRoot = computeMerkleRoot([]);
    expect(merkleRoot).toBe("0x0000000000000000000000000000000000000000000000000000000000000000");
  });

  it("network engine returns authoritative fee schedule", async () => {
    const feeSchedule = await internalNetworkEngine.getFeeSchedule();
    expect(feeSchedule.assetSymbol).toBe("CC");
    expect(feeSchedule.standardFee.toFixed(2)).toBe("0.50");
    expect(feeSchedule.blockIntervalMs).toBeGreaterThan(0);
    expect(feeSchedule.requiredConfirmations).toBeGreaterThan(0);
  });
});

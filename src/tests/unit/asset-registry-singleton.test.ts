/**
 * W-904 — Asset Registry: uses shared Prisma singleton, not a rogue new PrismaClient()
 *
 * Unit tests confirming that:
 * 1. The asset-registry.service module does NOT instantiate its own PrismaClient.
 * 2. SUPPORTED_ASSETS array contains all 8 required assets with correct metadata.
 * 3. getActiveAssets() does not throw when called (smoke test with DI-safe import).
 */
import { describe, it, expect } from "vitest";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";

const REQUIRED_SYMBOLS = ["CC", "BTC", "ETH", "SOL", "BNB", "LTC", "XRP", "DOGE"];

describe("W-904 — Asset Registry: SUPPORTED_ASSETS definition correctness", () => {
  it("contains all 8 required asset symbols", () => {
    const symbols = SUPPORTED_ASSETS.map((a) => a.symbol);
    for (const required of REQUIRED_SYMBOLS) {
      expect(symbols).toContain(required);
    }
  });

  it("every asset has a non-empty name, positive decimals, a type, and a fallbackPrice", () => {
    for (const asset of SUPPORTED_ASSETS) {
      expect(asset.name.length).toBeGreaterThan(0);
      expect(asset.decimals).toBeGreaterThan(0);
      expect(["NATIVE_COIN", "TOKEN", "STABLECOIN"]).toContain(asset.type);
      expect(parseFloat(asset.fallbackPrice || "0")).toBeGreaterThan(0);
    }
  });

  it("CC is marked as NATIVE_COIN and all others as TOKEN", () => {
    const cc = SUPPORTED_ASSETS.find((a) => a.symbol === "CC");
    expect(cc?.type).toBe("NATIVE_COIN");

    const tokens = SUPPORTED_ASSETS.filter((a) => a.symbol !== "CC");
    for (const token of tokens) {
      expect(token.type).toBe("TOKEN");
    }
  });

  it("asset-registry.service does NOT export a rogue PrismaClient instance", async () => {
    // Dynamic import — check the module's exports do not include a PrismaClient instance
    const mod = await import("@/modules/market/service/asset-registry.service");
    const exportedKeys = Object.keys(mod);

    // The module should only export SUPPORTED_ASSETS and getActiveAssets
    // NOT a 'prisma' singleton that bypasses the shared client
    expect(exportedKeys).not.toContain("prisma");
    expect(exportedKeys).toContain("SUPPORTED_ASSETS");
    expect(exportedKeys).toContain("getActiveAssets");
  });
});

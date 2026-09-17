import { describe, it, expect } from "vitest";
import { SUPPORTED_ASSETS } from "@/modules/market/service/asset-registry.service";
import { SUPPORTED_COINS } from "@/modules/market/service/price-feed.service";

describe("Asset Registry & Supported Coins (W-701 Unit)", () => {
  it("should have exactly 8 supported assets configured", () => {
    expect(SUPPORTED_ASSETS).toBeDefined();
    expect(SUPPORTED_ASSETS.length).toBe(8);
  });

  it("should contain all required symbols with unique uppercase identifiers", () => {
    const symbols = SUPPORTED_ASSETS.map((a) => a.symbol);
    const expectedSymbols = ["CC", "BTC", "ETH", "SOL", "BNB", "LTC", "XRP", "DOGE"];

    for (const expected of expectedSymbols) {
      expect(symbols).toContain(expected);
    }

    const uniqueSymbols = new Set(symbols);
    expect(uniqueSymbols.size).toBe(8);
  });

  it("should configure proper precision decimals for each asset type", () => {
    const assetMap = new Map(SUPPORTED_ASSETS.map((a) => [a.symbol, a]));

    expect(assetMap.get("CC")?.decimals).toBe(8);
    expect(assetMap.get("BTC")?.decimals).toBe(8);
    expect(assetMap.get("ETH")?.decimals).toBe(18);
    expect(assetMap.get("SOL")?.decimals).toBe(9);
    expect(assetMap.get("BNB")?.decimals).toBe(18);
    expect(assetMap.get("LTC")?.decimals).toBe(8);
    expect(assetMap.get("XRP")?.decimals).toBe(6);
    expect(assetMap.get("DOGE")?.decimals).toBe(8);
  });

  it("should align non-native coinGeckoIds with SUPPORTED_COINS in price-feed.service", () => {
    const externalAssets = SUPPORTED_ASSETS.filter((a) => a.symbol !== "CC");
    const supportedCoinIds = new Set(SUPPORTED_COINS.map((c) => c.id));

    for (const asset of externalAssets) {
      expect(asset.coinGeckoId).toBeDefined();
      expect(supportedCoinIds.has(asset.coinGeckoId as any)).toBe(true);
    }
  });
});

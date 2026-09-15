import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/network/stats/route";

describe("Live Network Stats API Integration (W-301)", () => {
  beforeAll(async () => {
    // Ensure test database connection
    await prisma.$connect();
  });

  it("calculates and returns live blockchain metrics from PostgreSQL", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty("blockHeight");
    expect(typeof data.blockHeight).toBe("number");
    expect(data).toHaveProperty("totalTransactions");
    expect(typeof data.totalTransactions).toBe("number");
    expect(data).toHaveProperty("avgBlockTime");
    expect(data.avgBlockTime).toBe("10.0s");
    expect(data).toHaveProperty("circulatingSupply");
    expect(typeof data.circulatingSupply).toBe("string");
    expect(data).toHaveProperty("gasPrice");
    expect(data).toHaveProperty("networkStatus");
    expect(data.networkStatus).toBe("ACTIVE");
  });
});

import { describe, it, expect } from "vitest";
import { generateJsonLd } from "@/components/seo/JsonLd";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("SEO & Schema.org Structured Data Architecture (W-302)", () => {
  it("generates valid Schema.org Organization, FinancialProduct, and WebSite structured data", () => {
    const jsonLd = generateJsonLd("http://127.0.0.1:3847");

    expect(jsonLd).toBeDefined();
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@graph"]).toBeInstanceOf(Array);

    const graph = jsonLd["@graph"];

    // 1. Organization schema
    const org = graph.find((item: any) => item["@type"] === "Organization");
    expect(org).toBeDefined();
    expect(org?.name).toBe("Coin Caret Platform");
    expect(org?.url).toBe("http://127.0.0.1:3847");

    // 2. FinancialProduct schema
    const finProduct = graph.find((item: any) => item["@type"] === "FinancialProduct");
    expect(finProduct).toBeDefined();
    expect(finProduct?.name).toBe("Coin Caret (CC)");
    expect(finProduct?.currency).toBe("CC");

    // 3. WebSite schema
    const webSite = graph.find((item: any) => item["@type"] === "WebSite");
    expect(webSite).toBeDefined();
    expect(webSite?.name).toBe("Coin Caret Mainnet Portal");
    expect(webSite?.potentialAction).toBeDefined();
  });

  it("generates a dynamic sitemap with clean RESTful slugs", async () => {
    const sitemapEntries = await sitemap();

    expect(Array.isArray(sitemapEntries)).toBe(true);
    expect(sitemapEntries.length).toBeGreaterThanOrEqual(8);

    const urls = sitemapEntries.map((entry) => entry.url);

    // Verify key clean slugs exist without .html
    expect(urls).toContain("http://127.0.0.1:3847/");
    expect(urls).toContain("http://127.0.0.1:3847/explorer");
    expect(urls).toContain("http://127.0.0.1:3847/wallet");
    expect(urls).toContain("http://127.0.0.1:3847/wallet/send");
    expect(urls).toContain("http://127.0.0.1:3847/wallet/receive");
    expect(urls).toContain("http://127.0.0.1:3847/wallet/withdraw");
    expect(urls).toContain("http://127.0.0.1:3847/login");
    expect(urls).toContain("http://127.0.0.1:3847/register");
  });

  it("generates valid robots.txt configuration with sitemap reference", () => {
    const robotsRules = robots();

    expect(robotsRules).toBeDefined();
    expect(robotsRules.rules).toBeDefined();
    expect(robotsRules.sitemap).toBe("http://127.0.0.1:3847/sitemap.xml");
  });
});

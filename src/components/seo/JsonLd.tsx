import React from "react";

export function generateJsonLd(baseUrl: string = "http://127.0.0.1:3847") {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "Coin Caret Platform",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`,
        "description": "Next-generation institutional Web3 digital currency network and high-throughput double-entry blockchain engine.",
        "sameAs": [
          "https://twitter.com/coincaret",
          "https://github.com/coincaret",
        ],
      },
      {
        "@type": "FinancialProduct",
        "@id": `${baseUrl}/#financial-product`,
        "name": "Coin Caret (CC)",
        "currency": "CC",
        "description": "Native utility and settlement asset of the Coin Caret network with 10s deterministic finality and sub-cent fees.",
        "provider": {
          "@id": `${baseUrl}/#organization`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": baseUrl,
        "name": "Coin Caret Mainnet Portal",
        "description": "Public marketing portal, block explorer, and decentralized asset management platform.",
        "publisher": {
          "@id": `${baseUrl}/#organization`,
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": `${baseUrl}/explorer?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${baseUrl}/#application`,
        "name": "Coin Caret Web Wallet",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
      },
    ],
  };
}

export function JsonLd({ baseUrl = "http://127.0.0.1:3847" }: { baseUrl?: string }) {
  const jsonLdData = generateJsonLd(baseUrl);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
    />
  );
}

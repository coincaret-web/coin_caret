import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3847";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explorer", "/login", "/register"],
      disallow: ["/api/", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

import type { MetadataRoute } from "next";
import { getSiteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/support", "/risk-check"],
        disallow: [
          "/account",
          "/analytics",
          "/deals",
          "/feedback",
          "/ops",
          "/auth",
          "/api",
          "/extraction-review",
          "/proposal-pack",
        ],
      },
    ],
    sitemap: getSiteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const publicRoutes = [
  {
    path: "/",
    priority: 1,
  },
  {
    path: "/risk-check",
    priority: 0.85,
  },
  {
    path: "/pricing",
    priority: 0.75,
  },
  {
    path: "/support",
    priority: 0.5,
  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: getSiteUrl(route.path),
    lastModified,
    changeFrequency: "weekly",
    priority: route.priority,
  }));
}

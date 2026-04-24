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
  {
    path: "/demo",
    priority: 0.8,
  },
  {
    path: "/sample-proposal-pack",
    priority: 0.75,
  },
  {
    path: "/about",
    priority: 0.55,
  },
  {
    path: "/case-studies",
    priority: 0.6,
  },
  {
    path: "/case-studies/saas-redesign-migration",
    priority: 0.55,
  },
  {
    path: "/case-studies/local-services-rebrand",
    priority: 0.55,
  },
  {
    path: "/compare",
    priority: 0.6,
  },
  {
    path: "/compare/scopeos-vs-chatgpt",
    priority: 0.55,
  },
  {
    path: "/compare/scopeos-vs-proposal-tools",
    priority: 0.55,
  },
  {
    path: "/privacy",
    priority: 0.35,
  },
  {
    path: "/terms",
    priority: 0.35,
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

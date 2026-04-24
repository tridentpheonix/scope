export const siteConfig = {
  name: "ScopeOS",
  url: process.env.APP_BASE_URL?.trim() || "https://scope-wheat.vercel.app",
  title: "ScopeOS | Scope risk checks for small web agencies",
  description:
    "ScopeOS helps small web design agencies turn messy website briefs into scope risk checks, proposal packs, pricing tiers, exclusions, and change-order protection.",
  keywords: [
    "ScopeOS",
    "website proposal scoping",
    "scope risk check",
    "web design agency proposals",
    "scope creep prevention",
    "proposal pack",
  ],
} as const;

export function getSiteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

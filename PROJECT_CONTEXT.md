# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Continue production hardening by deciding the next safety slice after alert webhook shipping: either incident visibility/runbook polish or async off-request-path handling.
- **Current Branch / State:** scopeos-publish is a git repo on `main`; the auth rate limiting, health endpoint, Stripe webhook dedupe, backup/restore drill tooling, and alert webhook shipping are committed and pushed; the latest production deployment is live and healthy.

## What Changed Since Last Handoff
- Added `src/lib/alerting.ts` so error diagnostics can be shipped to a dedicated alert webhook.
- Wired `src/lib/diagnostics.ts` to forward error diagnostics to the alert sink without affecting the request path.
- Added `ALERT_WEBHOOK_URL` / `ALERT_WEBHOOK_SECRET` to env handling and documented them in `.env.example` and the operational docs.
- Added `src/lib/alerting.test.ts` and `src/lib/diagnostics-alerting.test.ts` to verify alert payloads and integration behavior.
- Added alerting visibility to the health snapshot and production hardening checklist.
- Verified the new alerting slice with targeted Vitest, targeted ESLint, `pnpm build`, and live Vercel smoke checks.

## What?s Next
- Decide whether the next slice should be incident visibility / operator dashboard polish or async off-request-path handling for slower side effects.
- Continue to keep the backup helpers as local drill tooling unless a staged migration utility becomes necessary.

## Blockers / Open Questions
- Atlas-native backups still need to be confirmed in the real production account.
- Backup helpers are local/staging drill tooling and not a substitute for managed provider snapshots.
- Alerting is currently webhook-based and intentionally lightweight; there is still no paging/incident-management integration.
- Slow/failure-prone background work is still mostly handled inline, so async offloading remains the next larger reliability gap.

## Commands Run + Results
- Ran targeted Vitest for the hardening and observability tests successfully.
- Ran targeted ESLint for the hardening modules, scripts, routes, and alerting helpers successfully.
- Ran `pnpm build` successfully after adding the alerting slice.
- Verified the latest Vercel production deployment and live `/api/health`, `/auth/sign-in`, and `/pricing` smoke checks successfully.

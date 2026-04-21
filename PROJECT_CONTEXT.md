# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Continue production hardening by adding observability/alerting on top of the MongoDB + first-party-auth modular monolith.
- **Current Branch / State:** scopeos-publish is a git repo on `main`; the auth rate limiting, health endpoint, Stripe webhook dedupe, and backup/restore drill baseline are committed and pushed; alert webhook shipping is now being added in the working tree and has passed targeted tests and `pnpm build`.

## What Changed Since Last Handoff
- Added `src/lib/alerting.ts` so error diagnostics can be shipped to a dedicated alert webhook.
- Wired `src/lib/diagnostics.ts` to forward error diagnostics to the alert sink without affecting the request path.
- Added `ALERT_WEBHOOK_URL` / `ALERT_WEBHOOK_SECRET` to env handling and documented them in `.env.example` and the operational docs.
- Added `src/lib/alerting.test.ts` and `src/lib/diagnostics-alerting.test.ts` to verify alert payloads and integration behavior.
- Added alerting visibility to the health snapshot and production hardening checklist.
- Verified the new alerting slice with targeted Vitest and a successful production build.

## What?s Next
- Commit and push the alerting slice.
- Continue with the remaining observability work: incident visibility, restore drills in staging, and a clearer operator dashboard/runbook if needed.
- Eventually decide whether to keep the backup helpers as local drill tooling only or extend them into a staged migration utility.

## Blockers / Open Questions
- Atlas-native backups still need to be confirmed in the real production account.
- Backup helpers are local/staging drill tooling and not a substitute for managed provider snapshots.
- Alerting is currently webhook-based and intentionally lightweight; there is still no paging/incident-management integration.

## Commands Run + Results
- Ran targeted Vitest for the hardening and observability tests successfully.
- Ran targeted ESLint for the hardening modules, scripts, routes, and alerting helpers successfully.
- Ran `pnpm build` successfully after adding the alerting slice.

# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Finish the async/off-request-path hardening slice for background cleanup, then verify the live deployment and continue toward production-ready ops coverage.
- **Current Branch / State:** scopeos-publish is a git repo on `main`; the auth rate limiting, health endpoint, Stripe webhook dedupe, backup/restore drill tooling, alert webhook shipping, and background-task worker slice are implemented locally but not yet committed in their final form.

## What Changed Since Last Handoff
- Added `src/lib/background-tasks.ts` plus a Vercel cron route and local processor script so attachment cleanup can run off the request path.
- Wired deal deletion to queue attachment cleanup work instead of waiting for file/blob deletion inline.
- Added `CRON_SECRET` handling, background-task health visibility, and Mongo TTL/index coverage for the task queue.
- Updated the production hardening docs and runbook to describe the new background cleanup worker.
- Verified the async slice with targeted Vitest, targeted ESLint, and a successful `pnpm build` after fixing type issues.

## What?s Next
- Commit and push the background-task worker slice, then verify the live deployment.
- After that, decide whether the next slice should be incident visibility / operator dashboard polish or any remaining async reliability work.

## Blockers / Open Questions
- Atlas-native backups still need to be confirmed in the real production account.
- Backup helpers are local/staging drill tooling and not a substitute for managed provider snapshots.
- Alerting is currently webhook-based and intentionally lightweight; there is still no paging/incident-management integration.
- The new background-task worker still needs live production verification after the next deploy.

## Commands Run + Results
- Ran targeted Vitest for the background-task, system-health, and deal-deletion tests successfully.
- Ran targeted ESLint for the async slice modules, scripts, routes, and helpers successfully.
- Ran `pnpm build` successfully after fixing the background-task worker type issues.

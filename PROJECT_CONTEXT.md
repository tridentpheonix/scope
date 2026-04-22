# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Finish the incident visibility / operator dashboard polish slice, then verify the live deployment and continue toward production-ready ops coverage.
- **Current Branch / State:** scopeos-publish is a git repo on `main`; the auth rate limiting, health endpoint, Stripe webhook dedupe, backup/restore drill tooling, alert webhook shipping, background-task worker slice, and `/ops` dashboard slice are implemented locally but not yet committed in their final form.

## What Changed Since Last Handoff
- Added a Mongo-backed diagnostic event mirror and a new `/ops` dashboard so operators can inspect recent warnings/errors plus system health in one place.
- Wired `recordDiagnostic` to mirror entries into Mongo for incident visibility without breaking the request path.
- Added the `/ops` page and linked it from the account quick actions for operator access.
- Added tests for the diagnostic mirror and incident snapshot helper.
- Updated the production hardening docs and runbook to describe the new operator dashboard.
- Verified the incident-visibility slice with targeted Vitest, targeted ESLint, and a successful `pnpm build`.

## What?s Next
- Commit and push the incident-visibility / operator-dashboard slice, then verify the live deployment.
- After that, decide whether to deepen alerting or keep tightening the operator workflows.

## Blockers / Open Questions
- Atlas-native backups still need to be confirmed in the real production account.
- Backup helpers are local/staging drill tooling and not a substitute for managed provider snapshots.
- Alerting is currently webhook-based and intentionally lightweight; there is still no paging/incident-management integration.
- The new operator dashboard still needs live production verification after the next deploy.

## Commands Run + Results
- Ran targeted Vitest for the incident-visibility, diagnostics-alerting, system-health, background-task, and deal-deletion tests successfully.
- Ran targeted ESLint for the new incident-visibility modules, dashboard page, and supporting helpers successfully.
- Ran `pnpm build` successfully after wiring the incident visibility dashboard.

# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Harden ScopeOS for production by adding auth rate limiting, a MongoDB health/readiness route, Stripe webhook idempotency, and operational runbook coverage without changing the modular-monolith architecture.
- **Current Branch / State:** local non-git workspace updated with production-hardening code and docs; targeted tests, ESLint, and `pnpm build` all passed; the repo now includes Mongo-backed auth rate limiting, `GET /api/health`, Stripe webhook reservation/finalization helpers, and a production hardening runbook.

## What Changed Since Last Handoff
- Added Mongo-backed auth rate limiting for sign-in/sign-up with IP and email buckets plus 429 responses.
- Added a MongoDB-backed health snapshot helper and `GET /api/health` readiness route.
- Added Stripe webhook event reservation/finalization helpers so duplicate deliveries are ignored and retries remain safe after failures.
- Added Mongo TTL/index coverage for auth rate limits and webhook event tracking.
- Added unit tests for auth rate limiting, system health, and Stripe webhook event tracking.
- Added `docs/ops/production-hardening.md` and linked it from the runbook as the operational checklist for backups, restore drills, rate limits, health checks, and webhook replay.
- Verified the hardening slice with targeted Vitest, targeted ESLint, and a successful `pnpm build`.

## What's Next
- Mirror or reconcile these changes into the deployable repo if needed, then deploy and verify the live health endpoint and auth limits in production.
- Rotate the exposed MongoDB user password if that operational step has not already been completed.
- Optionally add the remaining backlog items from the hardening roadmap: backup/restore drill automation, background-job offloading, and broader observability/alerting.

## Blockers / Open Questions
- Production validation still needs a live deploy check against the configured Atlas cluster.
- Existing historical Neon data is still not migrated into MongoDB by this hardening slice.

## Commands Run + Results
- Ran `winget install --id MongoDB.Server --exact --accept-source-agreements --accept-package-agreements` successfully.
- Ran `pnpm install --offline=false` successfully and updated dependencies to include `mongodb` while removing Neon packages.
- Ran `pnpm db:migrate` successfully after patching the local DB bootstrap script.
- Ran `pnpm exec eslint src/lib/env.ts src/lib/mongo.ts src/lib/auth/first-party.ts src/lib/auth/server.ts src/lib/auth/client.ts src/lib/workspace-billing.ts src/app/api/auth/sign-up/route.ts src/app/api/auth/sign-in/route.ts src/app/api/auth/sign-out/route.ts src/app/api/auth/local-sign-out/route.ts src/components/auth-panel.tsx src/app/auth/sign-in/page.tsx middleware.ts src/lib/risk-check-storage.ts src/lib/extraction-review-storage.ts src/lib/proposal-pack-storage.ts src/lib/change-order-storage.ts src/lib/export-blocker-storage.ts src/lib/analytics-storage.ts src/lib/ai-runs.ts src/lib/pilot-feedback-storage.ts src/lib/deal-deletion.ts src/lib/attachment-reconciliation.ts src/app/pricing/page.tsx src/scripts/test-db.ts --max-warnings=0` successfully.
- Ran `pnpm build` successfully.
- Started `pnpm start`, requested `http://127.0.0.1:3000/auth/sign-in`, got HTTP 200, confirmed expected auth content, then stopped the local server.
- Ran targeted Vitest for `src/lib/auth-rate-limit.test.ts`, `src/lib/system-health.test.ts`, and `src/lib/stripe-webhook-events.test.ts` successfully.
- Ran targeted ESLint for the new hardening modules and routes successfully.
- Ran `pnpm build` successfully with the new `/api/health` route included in the build manifest.
- Re-ran targeted tests, targeted ESLint, and a final `pnpm build` after tightening the auth-rate-limit expiry guard.

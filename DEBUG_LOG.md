# DEBUG LOG

## 2026-04-22
- Added a Mongo-backed diagnostic mirror and a new `/ops` dashboard so operators can inspect recent warnings/errors and core health in one place.
- Wired `recordDiagnostic` to mirror entries into Mongo without breaking the request path.
- Added the `/ops` page, linked it from the account quick actions, and documented the operator workflow.
- Added tests for the diagnostic mirror and incident snapshot helper.
- Verified the incident-visibility slice with targeted Vitest, targeted ESLint, and a successful `pnpm build`.

## 2026-04-22
- Added `src/lib/background-tasks.ts` plus a Vercel cron route and local processor so attachment cleanup can happen off the request path.
- Wired deal deletion to enqueue background cleanup work instead of waiting for file/blob deletion inline.
- Added `CRON_SECRET` handling, background-task health visibility, and Mongo TTL/index coverage for queued maintenance jobs.
- Updated the production hardening docs and runbook for the background cleanup worker.
- Verified the async slice with targeted Vitest, targeted ESLint, and a successful `pnpm build` after fixing the worker import/type issues.

## 2026-04-22
- Added `src/lib/alerting.ts` so error diagnostics can be shipped to a dedicated alert webhook.
- Wired `src/lib/diagnostics.ts` to forward error diagnostics to the alert sink without breaking the request path.
- Added `ALERT_WEBHOOK_URL` / `ALERT_WEBHOOK_SECRET` handling and documented the new env vars in the repo.
- Added unit/integration tests for alert payloads and the diagnostics -> alerting path.
- Added alerting visibility to the health snapshot and production hardening docs.
- Verified the alerting slice with targeted Vitest, targeted ESLint, and a successful `pnpm build`.

## 2026-04-22
- Added `src/lib/alerting.ts` so error diagnostics can be shipped to a dedicated alert webhook.
- Wired `src/lib/diagnostics.ts` to forward error diagnostics to the alert sink without breaking the request path.
- Added `ALERT_WEBHOOK_URL` / `ALERT_WEBHOOK_SECRET` handling and documented the new env vars in the repo.
- Added unit/integration tests for alert payloads and the diagnostics -> alerting path.
- Added alerting visibility to the health snapshot and production hardening docs.
- Verified the alerting slice with targeted Vitest, targeted ESLint, `pnpm build`, and live Vercel smoke checks.

## 2026-04-22
- Added MongoDB backup/restore drill helpers in `src/lib/mongo-backup.ts` using BSON EJSON so date fields and other Mongo-native values round-trip correctly.
- Added `scripts/mongo-backup.ts` and `scripts/mongo-restore.ts` for repeatable staging drills.
- Added a shared local env loader in `src/scripts/load-local-env.ts` and reused it from `src/scripts/test-db.ts`.
- Added a backup round-trip unit test for the EJSON helper.
- Verified the new backup slice with targeted Vitest, targeted ESLint, and a successful `pnpm build` after fixing the restore typing issues.

## 2026-04-21
- Added Mongo-backed auth rate limiting for sign-in/sign-up with IP and email buckets.
- Added a MongoDB-backed health snapshot helper and `GET /api/health` readiness route.
- Added Stripe webhook event reservation/finalization helpers so duplicate deliveries are ignored and retries remain safe after failures.
- Added TTL/index coverage for auth rate limits and webhook event tracking in the MongoDB bootstrap path.
- Added unit tests for the new hardening helpers and verified them with targeted Vitest.
- Ran targeted ESLint on the production-hardening routes and helpers successfully.
- Ran `pnpm build` successfully with the new health route and hardening code included.

## 2026-04-19
- Pivoted ScopeOS away from Neon auth/Postgres runtime dependencies toward MongoDB plus first-party auth/session handling.
- Added a dedicated MongoDB client helper with index bootstrap for users, sessions, workspaces, memberships, submissions, analytics events, AI runs, and pilot feedback.
- Replaced the auth client/server flow with app-owned sign-up, sign-in, sign-out, and cookie-backed session resolution.
- Reworked the main workspace storage helpers to use MongoDB on the primary runtime path while preserving local filesystem fallback behavior.

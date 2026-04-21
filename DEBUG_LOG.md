# DEBUG LOG

## 2026-04-21
- Added Mongo-backed auth rate limiting for sign-in/sign-up with IP and email buckets.
- Added a MongoDB-backed health snapshot helper and `GET /api/health` readiness route.
- Added Stripe webhook event reservation/finalization helpers so duplicate deliveries are ignored and retries remain safe after failures.
- Added TTL/index coverage for auth rate limits and webhook event tracking in the MongoDB bootstrap path.
- Added unit tests for the new hardening helpers and verified them with targeted Vitest.
- Ran targeted ESLint on the production-hardening routes and helpers successfully.
- Ran `pnpm build` successfully with the new health route and hardening code included.
- Re-ran targeted tests, targeted ESLint, and a final `pnpm build` after tightening the auth-rate-limit expiry guard.

## 2026-04-19
- Pivoted ScopeOS away from Neon auth/Postgres runtime dependencies toward MongoDB plus first-party auth/session handling.
- Added a dedicated MongoDB client helper with index bootstrap for users, sessions, workspaces, memberships, submissions, analytics events, AI runs, and pilot feedback.
- Replaced the auth client/server flow with app-owned sign-up, sign-in, sign-out, and cookie-backed session resolution.
- Reworked the main workspace storage helpers to use MongoDB on the primary runtime path while preserving local filesystem fallback behavior.

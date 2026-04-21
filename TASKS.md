# TASKS

## MILESTONES
1. **Local architecture cutover**
   - MongoDB + first-party auth running locally
   - local smoke verification complete
2. **Hosted architecture cutover**
   - production MongoDB chosen and configured
   - Vercel env vars added and hosted smoke verified
3. **Reliability + observability**
   - browser smoke coverage for the concierge flow
   - structured logging / failure visibility for core paths
4. **Launch readiness**
   - billing edge-case cleanup
   - final QA, docs, and handoff polish
5. **Production hardening**
   - auth rate limiting
   - MongoDB health/readiness route
   - Stripe webhook dedupe
   - backup/restore drill workflow
   - operational runbook coverage

## NOW
- the backup/restore drill scripts are in place in the working tree.
- next step: commit/push the drill slice and decide whether to add lightweight alerting next.

## NEXT
- verify the drill scripts in a staging copy or local drill environment.
- confirm Atlas native backup settings in production.
- optionally add a minimal alerting/dashboard hook for the critical diagnostics path.

## LATER
- [H19] create a one-time Neon -> Mongo migration utility if old production data must be preserved.
- [H20] remove stale Neon terminology from remaining historical docs and helper names.
- [H21] move slow, failure-prone work off the request path with queue/background-job handling.

## COMPLETED
- [H18] installed local MongoDB Community Server, configured `.env` for `mongodb://127.0.0.1:27017`, and completed local bootstrap/build/smoke verification.
- [H17] added MongoDB client bootstrap/index management and updated the repo env/scripts/docs for the new stack.
- [H16] replaced Neon auth/runtime dependencies with first-party auth routes, app-owned session cookies, and MongoDB-backed workspace storage helpers.
- [H15] wired a real in-app pilot feedback inbox at `/feedback` with storage, API, and retention cleanup.
- [H14] documented the pilot feedback playbook and linked it from the launch handoff.
- [H13] finished the final release-polish sweep with a README, cleaner ignore rules, and a passing production build.

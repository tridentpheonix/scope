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
   - operational backup/restore runbook

## NOW
- production hardening phase 1 is implemented in code and docs.
- next step: mirror these changes into the deployable repo and verify the live app against Atlas/Vercel.

## NEXT
- if hosting on Vercel matters now, confirm the production MongoDB instance is the one wired into `MONGODB_URI`.
- verify `GET /api/health` in the deployed environment.
- verify the sign-in/sign-up 429 path and Stripe webhook dedupe behavior in production.
- optionally add backup/restore drill automation and alerting.

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

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
- finish the async/background-task slice by committing it and verifying the live deploy.

## NEXT
- verify `/api/health` and the production app after the async/background-task deploy.
- evaluate whether to ship incident visibility / operator dashboard polish next.
- keep the backup/restore drill workflow available for staging restores.

## LATER
- [H19] create a one-time Neon -> Mongo migration utility if old production data must be preserved.
- [H20] remove stale Neon terminology from remaining historical docs and helper names.
- [H21] add persistent incident visibility if webhook-based alerting proves too noisy or too thin.
- [H22] confirm whether any Stripe/AI/background jobs should be moved to a durable worker model next.
- [H23] consider a stronger restore/backup automation story once Atlas-native backups are confirmed.

## COMPLETED
- [H18] installed local MongoDB Community Server, configured `.env` for `mongodb://127.0.0.1:27017`, and completed local bootstrap/build/smoke verification.
- [H17] added MongoDB client bootstrap/index management and updated the repo env/scripts/docs for the new stack.
- [H16] replaced Neon auth/runtime dependencies with first-party auth routes, app-owned session cookies, and MongoDB-backed workspace storage helpers.
- [H15] wired a real in-app pilot feedback inbox at `/feedback` with storage, API, and retention cleanup.
- [H14] documented the pilot feedback playbook and linked it from the launch handoff.
- [H13] finished the final release-polish sweep with a README, cleaner ignore rules, and a passing production build.

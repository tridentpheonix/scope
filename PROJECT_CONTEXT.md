# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Finish the MongoDB cutover cleanup, keep the live deployment verified, and push the repo cleanup to `main`.
- **Current Branch / State:** local workspace updated; production-style Next.js app already exists with MongoDB + first-party auth wired, the latest production deployment is live on Vercel, and the runtime source no longer contains Neon-era helper names.

## What Changed Since Last Handoff
- Swapped Neon auth/storage for MongoDB-backed auth and workspace persistence.
- Added `src/lib/mongo.ts` with connection caching, index bootstrapping, and a clean shutdown helper for one-off scripts.
- Added first-party auth routes for sign-up, sign-in, and sign-out.
- Removed the old Neon auth bridge routes.
- Updated the repo MongoDB smoke script to load local env files and close the Mongo connection cleanly after the check.
- Renamed the Mongo-backed storage compatibility helpers to match the current architecture and removed the dead Neon migration shim file.
- Updated the environment sample and local scripts to use `MONGODB_URI` / `MONGODB_DB_NAME`.
- Confirmed the local MongoDB service is running and the app builds and serves with the Mongo config.

## GA Milestones
1. **MongoDB deployment verification**
   - keep the live Vercel app on the Mongo-backed production deploy
   - smoke sign-in/sign-out and a protected page
2. **Repo cleanup and handoff**
   - push the Mongo fixups to `main`
   - rotate any exposed secrets after verification
3. **Follow-up hardening**
   - trim remaining legacy Neon references in historical docs only if they keep causing confusion

## What's Next
- Verify the Mongo deployment after the fresh Vercel redeploy.
- Push the Mongo cleanup commit to `main`.
- Rotate the exposed MongoDB user password after the deployment is confirmed.

## Blockers / Open Questions
- None blocking the code fix itself.
- Live verification still depends on Vercel receiving a fresh deployment with the Mongo env vars active.

## Commands Run + Results
- Ran `pnpm exec eslint src/lib/env.ts src/lib/analytics-storage.ts src/lib/attachment-reconciliation.ts src/lib/change-order-storage.ts src/lib/deal-deletion.ts src/lib/export-blocker-storage.ts src/lib/extraction-review-storage.ts src/lib/pilot-feedback-storage.ts src/lib/proposal-pack-storage.ts src/lib/risk-check-storage.ts src/lib/attachment-storage.ts --max-warnings=0` successfully.
- Ran `pnpm build` successfully.




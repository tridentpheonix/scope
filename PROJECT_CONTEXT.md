# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Finish the MongoDB cutover, verify the deployed app is using the hosted MongoDB env vars, and push the repo cleanup to `main`.
- **Current Branch / State:** local workspace updated; production-style Next.js app already exists with MongoDB + first-party auth wired, the latest production deployment is ready on Vercel, and the live app still needs a fresh redeploy/verification pass after the Mongo env vars were added.

## What Changed Since Last Handoff
- Swapped Neon auth/storage for MongoDB-backed auth and workspace persistence.
- Added `src/lib/mongo.ts` with connection caching, index bootstrapping, and a clean shutdown helper for one-off scripts.
- Added first-party auth routes for sign-up, sign-in, and sign-out.
- Removed the old Neon auth bridge routes.
- Updated the repo MongoDB smoke script to load local env files and close the Mongo connection cleanly after the check.
- Updated the environment sample and local scripts to use `MONGODB_URI` / `MONGODB_DB_NAME`.
- Updated the Mongo-backed storage helpers to use the new database path.
- Confirmed the local MongoDB service is running and the app builds and serves with the Mongo config.

## GA Milestones
1. **MongoDB deployment verification**
   - confirm the live Vercel app is using the hosted MongoDB env vars
   - smoke sign-in/sign-out and a protected page
2. **Repo cleanup and handoff**
   - push the Mongo fixups to `main`
   - rotate any exposed secrets after verification
3. **Follow-up hardening**
   - clean up remaining legacy Neon references only if they still matter to the runtime

## What's Next
- Verify the Mongo deployment after the fresh Vercel redeploy.
- Push the Mongo cleanup commit to `main`.
- Rotate the exposed MongoDB user password after the deployment is confirmed.

## Blockers / Open Questions
- None blocking the code fix itself.
- Live verification still depends on Vercel receiving a fresh deployment with the Mongo env vars active.

## Commands Run + Results
- Ran `pnpm exec eslint src/lib/mongo.ts src/scripts/test-db.ts --max-warnings=0` successfully.
- Ran `pnpm build` successfully.




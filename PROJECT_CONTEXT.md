# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Continue production hardening by adding repeatable backup/restore drill automation and operational docs on top of the MongoDB + first-party-auth modular monolith.
- **Current Branch / State:** scopeos-publish is a git repo on `main`; the auth rate limiting, health endpoint, and Stripe webhook dedupe baseline is committed and pushed; local backup/restore drill scripts and EJSON backup helpers are added in the working tree and have passed targeted tests and `pnpm build`.

## What Changed Since Last Handoff
- Added `src/lib/mongo-backup.ts` with MongoDB JSON/EJSON backup and restore helpers.
- Added `scripts/mongo-backup.ts` and `scripts/mongo-restore.ts` for repeatable staging drill snapshots.
- Added `src/scripts/load-local-env.ts` so one-off scripts can load `.env` consistently.
- Updated `src/scripts/test-db.ts` to reuse the shared env loader.
- Added `src/lib/mongo-backup.test.ts` to verify EJSON round-tripping for date fields.
- Added docs for the drill scripts in `docs/ops/production-hardening.md` and the runbook.
- Verified the new backup helpers with targeted Vitest and a successful production build.

## What?s Next
- Commit and push the backup/restore drill slice.
- Optionally wire a lightweight alerting/dashboard story for the critical diagnostics path.
- Eventually decide whether to keep the backup helpers as local drill tooling only or extend them into a staged migration utility.

## Blockers / Open Questions
- Atlas-native backups still need to be confirmed in the real production account.
- Backup helpers are local/staging drill tooling and not a substitute for managed provider snapshots.

## Commands Run + Results
- Ran targeted Vitest for `src/lib/mongo-backup.test.ts`, `src/lib/auth-rate-limit.test.ts`, `src/lib/system-health.test.ts`, and `src/lib/stripe-webhook-events.test.ts` successfully.
- Ran targeted ESLint for the hardening modules, scripts, and routes successfully.
- Ran `pnpm build` successfully after fixing the Mongo backup restore typing.

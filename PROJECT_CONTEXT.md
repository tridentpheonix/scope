# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Post-launch preparation is documented and wired into the app with a pilot feedback inbox; the release-polish pass remains verified with targeted tests and a production build.
- **Current Branch / State:** local workspace updated; production-style Next.js app already exists with Neon + Stripe + AI paths wired, schema management runs through explicit Neon migrations, client uploads no longer live in Postgres by default, maintenance diagnostics ship to an optional webhook sink, the code builds cleanly, and pilot feedback intake is available at `/feedback`.

## What Changed Since Last Handoff
- `.env.example` was scrubbed so no secret-looking values remain in the committed sample file and now includes `BLOB_READ_WRITE_TOKEN` as a placeholder.
- Neon schema management now runs through explicit migrations tracked in `app_schema_migrations`.
- Added `src/lib/neon-migrations.ts` with the initial schema migration definition.
- `dbQuery()` no longer performs schema bootstrapping on every request.
- Added `pnpm db:migrate` alongside the existing bootstrap alias.
- A dedicated `src/lib/workspace-scope.ts` guard rejects cross-workspace writes when a submission ID is reused incorrectly.
- Proposal pack, extraction review, and change-order saves now preflight the current row's workspace ownership before updating.
- A small unit test covers the workspace ownership guard.
- Attachment persistence now uses Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured, with a filesystem fallback for local development.
- Attachment metadata is now stored in Postgres only; file bytes are no longer written into the submissions row.
- Deal deletion now removes blob-backed attachments as part of client-material cleanup.
- Deal deletion now also clears related analytics/export feedback records and treats blob cleanup as best-effort.
- A new attachment-storage test covers the filesystem fallback and cleanup path.
- The deal-deletion test now covers export-feedback cleanup on the local path.
- Saved-deals and proposal-memory reads now cap the recent history they load by default so the common workspace views avoid full-history scans.
- The risk-check service test was updated to reflect recent-first submission ordering from the capped read path.
- The analytics dashboard now reads totals and recent items through aggregate queries rather than loading the full event history first.
- A new analytics-storage test covers the dashboard summary helper on the local fallback path.
- Saved deals now expose the attachment name and a download action when client materials exist.
- A new authenticated attachment route streams the stored file back to the user from Blob, disk, or legacy content.
- A new attachment-storage test now verifies the retrieval path on local files.
- Deal delete/download routes now emit structured diagnostics with a deal-specific area for observability.
- The diagnostics contract has a small test for the new deal area.
- Saved deals now page through the recent 100-item window with previous/next controls.
- Analytics event submissions, export feedback, and AI run reads now emit structured diagnostics on validation and failure paths.
- The signed-in workspace launchpad now shows attachment state and a direct download action on recent deal cards.
- Local NDJSON/file-backed readers now skip malformed or incomplete records instead of crashing workspace views.
- Malformed JSON request bodies on billing, analytics, export feedback, and extraction-review routes now return 400s instead of bubbling 500s.
- The dev auth session route now rejects unknown auth modes instead of silently treating them as sign-in.
- The migration runner was executed successfully against the configured Neon database.
- Added a maintenance-area diagnostics path plus a webhook-backed observability sink for warn/error diagnostics.
- Added a Neon migration that tightens submission/workspace guardrails for submission-linked tables and re-ran the migration runner successfully.
- Added an attachment reconciliation helper/CLI that deletes orphaned files and blobs, with a test covering local filesystem cleanup.
- Added observability and reconciliation regression tests, then re-ran targeted lint/tests successfully.
- Added a project README with setup, env vars, operational commands, and deployment notes.
- Tightened `.gitignore` for local release artifacts and cleaned the obvious root log files that were safe to remove.
- Ran a production build successfully after the final polish sweep.
- Added `docs/pilot-feedback.md` and linked it from the launch handoff so the next step is real-user feedback collection.
- Added a pilot feedback table, storage layer, API route, and in-app `/feedback` inbox page with account and launchpad shortcuts.

## GA Milestones
1. **Product shell polish**
   - authenticated home launchpad
   - clear next best action
   - better empty states and guidance
2. **Reliability + observability**
   - browser smoke coverage for the core concierge flow
   - structured logging and failure visibility
3. **AI quality + polish**
   - prompt/model evaluation loop
   - clearer AI run history and recovery paths
4. **Launch readiness**
   - billing/account edge cases
   - final cleanup and handoff docs

## What?s Next
- Decide whether to stop here or add any remaining list pagination if a future screen needs it.
- Keep monitoring billing, auth, AI, and autosave diagnostics during real usage.

## Blockers / Open Questions
- None blocking the current release state.
- Long-term: decide whether to keep or remove any future QA-only helpers after real usage feedback arrives.

## Commands Run + Results
- Ran `pnpm exec eslint src/lib/attachment-storage.ts src/lib/attachment-storage.test.ts src/lib/risk-check-storage.ts src/lib/deal-deletion.ts src/lib/env.ts --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/attachment-storage.test.ts src/lib/deal-deletion.test.ts` successfully.
- Ran `pnpm exec eslint src/lib/analytics-storage.ts src/lib/analytics-storage.test.ts src/lib/export-blocker-storage.ts src/app/analytics/page.tsx --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/analytics-storage.test.ts src/lib/export-blocker-storage.test.ts` successfully.
- Ran `pnpm exec eslint src/lib/attachment-storage.ts src/lib/attachment-storage.test.ts src/lib/risk-check-storage.ts src/lib/saved-deals.ts src/app/deals/page.tsx src/app/api/deals/[id]/attachment/route.ts --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/attachment-storage.test.ts src/lib/risk-check-service.test.ts` successfully.
- Ran `pnpm exec eslint src/lib/diagnostics.ts src/lib/diagnostics.test.ts src/app/api/deals/[id]/route.ts src/app/api/deals/[id]/attachment/route.ts src/lib/attachment-storage.ts src/lib/risk-check-storage.ts src/lib/saved-deals.ts src/app/deals/page.tsx --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/diagnostics.test.ts src/lib/attachment-storage.test.ts src/lib/deal-deletion.test.ts` successfully.
- Ran `pnpm exec eslint src/lib/diagnostics.ts src/lib/diagnostics.test.ts src/app/api/events/route.ts src/app/api/export-blocker/route.ts src/app/api/ai/runs/[id]/route.ts src/app/api/deals/[id]/route.ts src/app/api/deals/[id]/attachment/route.ts src/app/deals/page.tsx src/lib/saved-deals.ts --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/diagnostics.test.ts src/lib/attachment-storage.test.ts src/lib/deal-deletion.test.ts src/lib/analytics-storage.test.ts` successfully.
- Ran `pnpm exec eslint src/components/workspace-launchpad.tsx src/lib/saved-deals.ts src/app/page.tsx --max-warnings=0` successfully.
- Ran `pnpm exec eslint src/lib/json-safe.ts src/lib/request-body.ts src/lib/analytics-storage.ts src/lib/analytics-storage.test.ts src/lib/export-blocker-storage.ts src/lib/export-blocker-storage.test.ts src/lib/risk-check-storage.ts src/lib/risk-check-service.test.ts src/lib/proposal-pack-storage.ts src/lib/proposal-pack-storage.test.ts src/lib/extraction-review-storage.ts src/lib/extraction-review-storage.test.ts src/lib/change-order-storage.ts src/lib/change-order-storage.test.ts src/lib/deal-deletion.ts src/lib/deal-deletion.test.ts src/app/api/billing/checkout/route.ts src/app/api/events/route.ts src/app/api/export-blocker/route.ts src/app/api/extraction-review/[id]/route.ts src/app/api/auth/session/route.ts --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/analytics-storage.test.ts src/lib/export-blocker-storage.test.ts src/lib/risk-check-service.test.ts src/lib/proposal-pack-storage.test.ts src/lib/extraction-review-storage.test.ts src/lib/change-order-storage.test.ts src/lib/deal-deletion.test.ts` successfully.
- Ran `pnpm exec eslint src/lib/neon-migrations.ts src/lib/attachment-reconciliation.ts src/lib/attachment-reconciliation.test.ts src/lib/observability.ts src/lib/observability.test.ts src/lib/diagnostics.ts src/lib/diagnostics.test.ts scripts/reconcile-orphan-attachments.ts --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/attachment-reconciliation.test.ts src/lib/observability.test.ts src/lib/diagnostics.test.ts src/lib/attachment-storage.test.ts` successfully.
- Ran `pnpm db:migrate` successfully.
- Ran `pnpm build` successfully.
- Ran `pnpm exec eslint src/lib/pilot-feedback-storage.ts src/lib/pilot-feedback-storage.test.ts src/app/api/pilot-feedback/route.ts src/components/pilot-feedback-form.tsx src/app/feedback/page.tsx src/app/account/page.tsx src/components/workspace-launchpad.tsx src/lib/deal-deletion.ts src/lib/deal-deletion.test.ts src/lib/diagnostics.ts src/lib/diagnostics.test.ts --max-warnings=0` successfully.
- Ran `pnpm exec vitest run src/lib/pilot-feedback-storage.test.ts src/lib/deal-deletion.test.ts src/lib/diagnostics.test.ts src/lib/attachment-reconciliation.test.ts src/lib/observability.test.ts src/lib/attachment-storage.test.ts` successfully.

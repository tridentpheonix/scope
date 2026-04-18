# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** Fix the live auth/session mismatch behind the pricing checkout failure and protected-route redirect loops, then publish and verify the deployment.
- **Current Branch / State:** local workspace updated; production-style Next.js app already exists with Neon + Stripe + AI paths wired, schema management runs through explicit Neon migrations, client uploads no longer live in Postgres by default, maintenance diagnostics ship to an optional webhook sink, the code builds cleanly, pilot feedback intake is available at `/feedback`, and the auth flow now prefers authoritative Neon session reads.

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
- Investigated the live pricing failure and found the app could trust cached Neon session data even when middleware rejected the protected route, creating `/risk-check` redirect loops and failed billing fetches.
- `src/lib/auth/server.ts` now requests an authoritative Neon session by disabling the cookie cache so server components and middleware stay aligned on auth state.
- `src/components/auth-panel.tsx` now uses `authClient.signIn.email()` / `authClient.signUp.email()` directly instead of the custom `/api/auth/session` bridge, so Neon manages its own cookies/session lifecycle.
- `src/app/auth/sign-in/page.tsx` dropped an unused import surfaced during the targeted lint pass.

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
- Push the auth-session fix to `main` and let Vercel redeploy.
- Verify the live `/pricing` -> checkout path again after deploy.
- If an existing browser still loops, sign out and sign back in once to clear stale session state.

## Blockers / Open Questions
- None blocking the code fix itself.
- Live verification still depends on Vercel completing the new deployment and the browser picking up the refreshed auth cookies.

## Commands Run + Results
- Ran `pnpm exec eslint src/lib/auth/server.ts src/components/auth-panel.tsx src/app/auth/sign-in/page.tsx src/app/pricing/page.tsx src/app/account/page.tsx src/components/site-header.tsx --max-warnings=0` successfully.
- Ran `pnpm build` successfully.

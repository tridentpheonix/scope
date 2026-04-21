# DEBUG LOG

## 2026-04-13
- Started GA polish planning for ScopeOS after the MVP and NVIDIA AI work were confirmed working.
- Identified the next high-value polish slice as a signed-in workspace launchpad and clearer first-run guidance.
- Shipped the signed-in workspace launchpad on the home page and tightened the deals empty state.
- Verified the new launchpad is visible on the live local app at `http://localhost:3001/`.
- Added a repo-owned browser smoke script that creates its own brief and verifies the full launchpad -> risk-check -> extraction-review -> proposal-pack -> launchpad path.
- Added structured diagnostics for intake, AI, billing, and webhook failures.
- Added a lightweight AI evaluation harness with fallback and live NVIDIA checks, plus a `tsx` runner that loads local env files before evaluating the concierge cases.
- Verified the CLI against the live NVIDIA provider; the report passed while still surfacing a few provider schema warnings that fell back safely.
- Found that the old smoke-test bypass helper was still carrying the browser QA flow, then removed it in favor of a real Neon Auth session backed by a dev-only local cookie.
- Debugged Next.js cookie/session behavior until the smoke flow could persist a usable browser session in development without any bypass flag.
- Re-ran the browser smoke after the auth-session fix and confirmed the full route path passed end to end.
- Wrote launch handoff notes into `docs/launch-handoff.md` so the next step is billing edge-case cleanup plus final GA handoff polish.
- Confirmed the current state was pushed to GitHub and deployed to Vercel, then verified the live deployment responds with HTTP 200.

## 2026-04-17
- Investigated the broken `/deals` and `/analytics` behavior and found the stale `PlanGate` function-prop path between the server pages and the client component.
- Removed the `PlanGate` dependency from those pages, deleted the dead component, and marked `/risk-check` as dynamic to clear the Next.js cookie warning in build output.
- Hardened proposal-pack and change-order autosave routes so aborted or empty JSON bodies no longer surface as server parse errors during smoke verification.
- Removed stale QA log artifacts from the workspace.
- Re-ran targeted lint, `pnpm build`, and the repo browser smoke; the smoke now passes end to end again on `http://localhost:3001/`.

## 2026-04-18
- Finished a final hardening sweep for malformed local data and malformed request bodies.
- Added shared JSON helpers so local storage readers skip corrupted NDJSON / JSON files instead of crashing workspace views.
- Hardened the billing checkout, analytics event, export blocker, extraction-review, and dev auth session routes so bad payloads fail closed with 400-level responses instead of bubbling unexpected 500s.
- Added regression coverage for malformed files and malformed payloads across analytics, proposal packs, extraction reviews, change orders, deal deletion, and risk-check reads.
- Re-ran targeted ESLint and Vitest on the touched storage and API layers; both passed.
- Added DB-level tenant guardrails via a follow-up Neon migration, then applied the migration runner successfully.
- Added an orphan-attachment reconciliation helper/CLI plus a local filesystem cleanup test; the dry-run/apply flow now logs maintenance diagnostics.
- Added a webhook-backed observability sink for warn/error diagnostics and covered it with targeted tests.
- Re-ran focused ESLint/Vitest on the migration, observability, diagnostics, and reconciliation files; all passed.
- Added a README, tightened ignore rules for local release artifacts, cleaned the safe root log files, and re-ran the production build successfully.
- Added a pilot feedback playbook in `docs/pilot-feedback.md` and linked it from the launch handoff for post-launch intake.
- Wired the playbook into a real in-app `/feedback` page with a pilot-feedback API, storage, account shortcuts, and deal-retention cleanup.
- Verified the new feedback path with targeted ESLint/Vitest and a successful production build.

- Investigated the live pricing page failure report and traced the real app-side symptoms to protected-route redirect loops plus failed billing fetches while browser extensions were also logging unrelated console noise.
- Identified that server components could trust cached Neon session data while middleware rejected the same expired/invalid session on protected routes, which explains the /risk-check redirect loop and checkout fetch failure on /pricing.
- Updated src/lib/auth/server.ts to disable Neon cookie-cache reads for authoritative session checks so UI auth state stays aligned with middleware/auth enforcement.
- Updated src/components/auth-panel.tsx to use the official Neon uthClient.signIn.email() / uthClient.signUp.email() flow instead of the custom /api/auth/session bridge, so auth cookies are managed by the library rather than our manual bridge.
- Removed an unused import from src/app/auth/sign-in/page.tsx surfaced by the targeted lint pass.
- Re-ran targeted ESLint on the touched auth/pricing files and a full pnpm build; both passed.

- Added a visible header-level sign-out control so users can clear a bad session without first reaching the account page.

- Investigated the live sign-out 403 and found Neon Auth is rejecting the origin on /api/auth/sign-out; added a local fallback route that clears the auth cookies so users can still recover from a bad session.

- Verified via a fresh live request that /pricing already renders the unauthenticated header correctly; the remaining issue was stale client state immediately after sign-out plus an over-emphasized header sign-out button.
- Updated the sign-out button to do a hard navigation (window.location.replace) after clearing auth state so the next page load always re-renders from fresh server auth.
- Reordered the header actions so the primary CTA stays first and the sign-out control becomes a lighter secondary action.

## 2026-04-21
- Verified the live MongoDB deployment still showed the old missing-config warning, which meant the new env vars had not been picked up by the active production deployment yet.
- Synced the repo's MongoDB smoke script with the local workspace fix so it loads `.env` and closes the Mongo connection cleanly after the check.
- Added a `closeMongoConnection()` helper to the Mongo client wrapper so one-off scripts can exit cleanly after bootstrapping indexes.
- Updated the project memory files to reflect the MongoDB cutover goal and the current push/verification step.
- Renamed the runtime storage compatibility helpers to Mongo-neutral names, removed the dead Neon migration shim file, and confirmed the source tree no longer contains Neon-era helper names.


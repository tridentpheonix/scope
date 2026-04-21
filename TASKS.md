# TASKS

## MILESTONES
1. **MongoDB deployment verification**
   - confirm the live app is reading the new MongoDB env vars
   - smoke the sign-in and protected-page flows
2. **Repo cleanup and push**
   - commit the Mongo helper/script fixups
   - push `main` to GitHub
3. **Follow-up hardening**
   - rotate the exposed MongoDB user password
   - trim legacy backend references in historical docs only if they still cause confusion

## NOW
- verify the live Vercel deployment after the Mongo env vars and repo cleanup are in place.
- push the Mongo script/helper fixups to `main`.

## NEXT
- if the live app still shows the missing-config warning, trigger a fresh Vercel deployment from the updated `main`.
- rotate the MongoDB user password once the deployment is confirmed.

## LATER
- remove legacy backend env references from docs only if they keep causing confusion.
- consider trimming historical backend notes only after the Mongo deployment is stable.

## COMPLETED
- [H10] polished the signed-in workspace launchpad cards to show attachment state and a direct client-material download action.
- [H9] added saved-deals pagination controls and extended structured diagnostics to analytics and AI run routes.
- [H8] added structured diagnostics for deal delete/download failures and extended the logger contract with a deal-specific area.
- [H7] added an authenticated client-material download route plus a download button on saved deals so attachments can be retrieved after upload.
- [H6] replaced the analytics dashboard full-history scan with aggregate summary reads and capped recent export-feedback events.
- [H5] capped recent-history reads for saved deals and proposal memory so the common workspace views stop scanning the full history tables by default.
- [H4] tightened client-material deletion so Neon and local retention cleanup also removes related analytics/export feedback records, with blob deletes now best-effort.
- [H3] moved client uploads out of Postgres into Vercel Blob when configured, with filesystem fallback and delete cleanup.
- [H2] replaced hidden request-time schema bootstrapping with explicit Neon migrations and added `pnpm db:migrate`.
- [H1] scrubbed `.env.example`, moved Neon schema setup out of request-time code, and added tenant ownership guards for workspace-scoped saves.
- [H11] hardened the remaining malformed-file and malformed-request-body edge cases across the local storage readers and main API routes.
- [H12] added DB-level tenant guardrails, orphan attachment reconciliation, and a webhook-backed observability sink for maintenance warnings/errors.
- [H13] finished the final release-polish sweep with a README, cleaner ignore rules, and a passing production build.
- [H14] documented the pilot feedback playbook and linked it from the launch handoff.
- [H15] wired a real in-app pilot feedback inbox at `/feedback` with storage, API, and retention cleanup.
- [M4.4] removed remaining launch-only log noise / QA artifacts and cleaned up the stale plan-gate path.
- [M4.3] finished the last billing / launch-checklist edge cases and verified the core launch flow.
- [M4.1] removed the smoke-test bypass helper and replaced it with a real-auth dev smoke session flow.
- [M4.2] added launch docs / handoff notes in `docs/launch-handoff.md` and tightened the launch checklist.
- [M4.6] fixed the live auth-session mismatch by forcing authoritative Neon session reads and moving email sign-in/sign-up onto the official Neon auth client flow.
- [M1.1] built a signed-in workspace launchpad on the home page with next-best-action guidance, recent-deal shortcuts, and a clearer first-run path.
- [M1.2] tightened the first-run empty states across saved deals so new users always get a concrete next step.
- [M2.1] added browser smoke coverage for the launchpad and the end-to-end brief -> review -> proposal path.
- [M2.2] added structured logging / diagnostics for AI, auth, billing, and webhook failures.
- [M3.1] added a lightweight AI evaluation harness with fallback checks, live NVIDIA smoke coverage, and a CLI runner for prompt/model regressions.
- [S1] chose small web design agencies selling SMB brochure/marketing website redesigns as the first ScopeOS niche.
- [S2] defined the exact v1 output format, first-value moment, and scoped proposal-pack workflow in `PRD.md`.
- [S3] built the initial marketing landing page plus Scope Risk Checker intake flow.
- [S4] ran 3 realistic concierge tests against the live intake flow using SMB website redesign briefs.
- [S5] refined the web-design prompt logic with stored missing-info detection, risk flags, and pricing-tier guidance.
- [S6] built the first editable proposal-pack export flow with section editing, copy/export actions, and a dedicated proposal draft route.
- [S10] added default revision-round, deposit, and change-order guardrails to the proposal-pack workflow.
- [S15] turned the stored analysis into an editable extraction review step before opening the proposal pack draft.
- [S16] tightened the separation between internal scoping notes and client-facing proposal blocks in the proposal-pack flow.
- [S17] added server-side proposal-pack draft persistence so proposal edits are no longer browser-only.
- [S18] added a lightweight saved-deals list so founders can reopen proposal drafts without hunting for IDs.
- [S19] persisted extraction-review edits server-side so internal review survives across browsers and devices.
- [S12] updated `PRD.md` to include production-minded v1 requirements for input validation, failure states, logging, retries, and deletable client material.
- [S13] added a phased delivery map to `PRD.md` and created the 5-phase documentation system under `phases/` with per-phase `artifacts.md` and `design.md` files.
- [S14] turned concierge-test risks into explicit missing-info prompts for copy ownership, migration, revisions, and integrations.
- [S11] validated that copy full pack + markdown are enough for the MVP export path; branded export stays deferred until paid users say send-time formatting blocks them.
- [S21] added proposal-pack analytics events for open, save, copy, and download actions.
- [S7] added scope drift + change-order capture with workspace autosave and a copy-ready change-order draft.
- [S8] added proposal memory from previous deals with one-click reuse for assumptions, exclusions, and commercial terms.
- [S22] built a dedicated analytics dashboard to summarize proposal-pack usage plus a branded-export gate capture form.
- [S23] added deletion controls for sensitive client material at both intake and proposal levels.
- [S9] created niche-specific clause packs with one-click apply in the proposal pack editor.
- [S20] shipped branded export (HTML + print-to-PDF) in the proposal pack editor.
- [S24] added Neon Auth sign-in, workspace account management, and account-aware navigation.
- [S25] migrated app persistence to Neon Postgres with workspace-scoped storage for all deal data and analytics.
- [S26] implemented Stripe subscription checkout, billing portal, and pricing/account control surfaces.
- [S27] added plan-gating UI patterns for saved history, analytics, and branded export features.
- [S28] wired real Stripe test price IDs into local env and verified authenticated checkout + billing portal smoke tests.
- [S29] fixed webhook billing sync so subscription-created and checkout-completed events persist paid plan, status, and Stripe IDs in Neon.
- [S30] shipped the first AI-assisted extraction review pass with deterministic fallback, optional LLM generation, and a one-click apply flow in the review editor.
- [S31] shipped the first AI-assisted proposal-pack rewrite with deterministic fallback, structured LLM generation, and a one-click apply flow in the proposal editor.
- [S32] added reusable AI run history for extraction-review and proposal-pack flows so the last saved rewrite can be restored after refresh or later review.
- [S33] prepared ScopeOS to use NVIDIA API credentials by adding NVIDIA env vars, provider resolution, and tests while keeping the OpenAI-compatible fallback path.
- [S34] fixed NVIDIA response parsing so the AI helpers read structured JSON from `reasoning_content` when `content` is empty.
- [S35] surfaced the active AI provider in the extraction-review and proposal-pack AI panels so founders can see when NVIDIA handled the run.
- [S36] exposed the AI provider in the saved-run history cards as well, so past generations remain explainable after refresh.
- [S37] turned the AI provider labels into friendly product-facing names so the UI reads as NVIDIA/OpenAI/Fallback instead of raw slugs.




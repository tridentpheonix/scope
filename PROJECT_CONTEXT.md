# PROJECT CONTEXT

- **Project:** ScopeOS
- **Baton Holder:** codex
- **Current Goal:** turn ScopeOS from MVP-complete into a GA-polished product with strong onboarding, reliable execution, observable AI usage, and a clean path to paid users.
- **Current Branch / State:** local workspace, production-style Next.js app running with Neon + Stripe + NVIDIA-compatible AI paths already wired; the old smoke-test bypass helper has been removed and browser QA now uses a real-auth dev session cookie flow.

## What Changed Since Last Handoff
- MVP workflow is in place for risk check, extraction review, proposal pack generation, saved deals, branded export, billing, and AI provider tracking.
- NVIDIA is a live provider option and the UI now explains which provider handled a run.
- The app now uses a real Neon Auth sign-up/sign-in flow plus a dev-only session cookie for local smoke tests instead of the old bypass helper.
- The home page now becomes a signed-in workspace launchpad with next-best-action guidance and recent-deal shortcuts.
- The saved-deals empty state was tightened so first-run users get a clearer path back to the launchpad and the first brief.
- A repo-owned browser smoke script now covers the launchpad plus auth -> risk-check -> extraction review -> proposal pack -> return-to-launchpad flow.
- Structured diagnostics now log intake, AI, billing, and webhook failures in a consistent JSON shape.
- A lightweight AI evaluation harness now runs fallback and live NVIDIA-backed checks across representative concierge cases and reports prompt/model regressions from a single CLI command.
- Launch handoff notes now live in `docs/launch-handoff.md` with env, smoke, verification, and launch checklist guidance.

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

## What’s Next
- Finish the final billing / launch-checklist edge cases before GA handoff.
- Then remove any remaining launch-only log noise or QA artifacts if they still affect developer flow.

## Blockers / Open Questions
- None blocking the next implementation slice.
- Long-term: decide whether to keep any other QA-only helpers after launch readiness work is done.

## Commands Run + Results
- Read `TASKS.md`, `BUILD_LOG.md`, `PRD.md`, the main app entry files, and the key API route files for diagnostics coverage.
- Ran targeted ESLint on the new launchpad, diagnostics, and browser smoke files.
- Ran Vitest for `workspace-launchpad` and `diagnostics` helpers.
- Ran the browser smoke script successfully against `http://localhost:3001/`.
- Verified `pnpm build` succeeds after the diagnostics typing fix.
- Ran the AI evaluation CLI in fallback-only mode and against the live NVIDIA provider; both passed on the current representative concierge cases.

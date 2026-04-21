# ScopeOS Launch Handoff

> Current product state, local setup, verification flow, and launch-readiness notes.

## Product summary

ScopeOS is a scoped-brief product for small web design agencies. The core flow is:

1. sign in
2. start a scope risk check
3. review extracted scope
4. generate or refine the proposal pack
5. return to the signed-in launchpad for the next deal

The app currently includes:

- first-party email/password auth with app-owned session cookies
- MongoDB-backed workspace storage
- Stripe billing and plan gating
- NVIDIA-compatible AI generation with deterministic fallback
- provider labels and AI run history
- browser smoke coverage for the critical journey
- structured diagnostics for core failures

## Local environment

Required env vars live in `C:/Users/satya/OneDrive/Desktop/ha ha ha ha/New idea/01-scopeos/.env`.

Minimum important values:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL`
- `NVIDIA_API_BASE_URL`
- `NVIDIA_API_KEY`
- `NVIDIA_MODEL`

## How to run locally

```powershell
pnpm dev
```

Open:

- `http://localhost:3000` during normal app work
- `http://localhost:3001` during local smoke verification when that port is in use

## Smoke verification flow

Use the repo-owned browser smoke script:

```powershell
node scripts/browser-smoke.js
```

Expected path:

1. sign up / sign in
2. land on the signed-in workspace launchpad
3. open risk check
4. submit a brief
5. open extraction review
6. continue to proposal pack
7. return to the launchpad

Success should print JSON with `ok: true`.

## Verification commands

Use the lightest useful checks:

```powershell
pnpm exec eslint src/lib/mongo.ts src/lib/auth/first-party.ts src/components/auth-panel.tsx scripts/browser-smoke.js --max-warnings=0
node scripts/browser-smoke.js
pnpm build
```

If you are changing AI logic, also run:

```powershell
pnpm vitest run src/lib/ai-provider.test.ts src/lib/extraction-review-ai.test.ts src/lib/proposal-pack-ai.test.ts
pnpm eval:ai
```

## Launch checklist

- [x] Confirm sign-in and launchpad rendering locally
- [x] Confirm risk-check submission creates a submission record
- [x] Confirm extraction review opens and proposal pack loads
- [x] Confirm the AI provider badge shows the expected provider
- [x] Confirm the saved AI history restores after refresh
- [x] Confirm billing checkout and billing portal still work
- [x] Confirm the browser smoke passes end to end
- [x] Confirm build passes
- [x] Confirm launch docs are current

## Known limits

- No blocking build warnings remain in the current launch flow.
- The local dev auth session cookie is a QA convenience and should remain dev-only.
- The AI timeout is intentionally bounded so slow live generation falls back instead of hanging the browser flow.

## Handoff notes

- The old smoke-test bypass helper has been removed.
- Browser QA now uses a real first-party auth session plus a dev-only local cookie fallback.
- Launch-readiness cleanup is complete; the next step is post-launch feedback and follow-up polish only.
- Use `docs/pilot-feedback.md` as the intake playbook for the first real users.
- The in-app feedback inbox now lives at `/feedback`.

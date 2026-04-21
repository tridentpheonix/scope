# ScopeOS

ScopeOS helps small web design agencies turn an intake brief into a structured risk check, extraction review, proposal pack, and reusable saved deal record.

It is a Next.js app with:
- first-party email/password auth and app-owned session cookies
- MongoDB for shared workspace data
- Vercel Blob for client-material uploads when configured
- Stripe for billing
- AI-assisted extraction review and proposal drafting

## Getting started

### Install

```bash
pnpm install
```

### Configure environment

Copy `.env.example` to `.env` and set the values you need:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO_MONTHLY`
- `STRIPE_PRICE_TEAM_MONTHLY`
- `APP_BASE_URL`
- `BLOB_READ_WRITE_TOKEN` for hosted attachment storage
- `OBSERVABILITY_WEBHOOK_URL` for hosted diagnostics shipping
- `OBSERVABILITY_WEBHOOK_SECRET` if your webhook expects a shared secret header
- AI provider credentials and model names

## Local and production health

- `GET /api/health` returns the MongoDB/auth readiness snapshot.
- `docs/ops/production-hardening.md` contains the backup/restore drill and production operational checklist.

### Run locally

```bash
pnpm db:migrate
pnpm dev
```

## Useful commands

- `pnpm lint` ? lint the repo
- `pnpm test` ? run the Vitest suite
- `pnpm build` ? production build
- `pnpm db:migrate` ? verify MongoDB connectivity and ensure required indexes
- `pnpm db:bootstrap` ? verify MongoDB connectivity and ensure required indexes
- `pnpm db:backup` ? export a JSON backup snapshot for staging drills
- `pnpm db:restore` ? restore a backup snapshot into MongoDB
- `pnpm attachments:reconcile` ? find orphaned uploads/blobs and clean them up
- `pnpm smoke:browser` ? run the browser smoke flow
- `pnpm eval:ai` ? run the AI evaluation harness

## What the app does

1. A user signs in.
2. They submit a scope/risk check brief.
3. The app stores the intake and optional client materials.
4. AI helpers can generate extraction review and proposal content.
5. The workspace can save, reopen, download, and delete client material.
6. Billing and usage events are recorded with structured diagnostics.

## Operational notes

- Client uploads are stored in Vercel Blob when configured; otherwise the app uses local filesystem fallback for development.
- Saved deals and analytics are intentionally capped/aggregated so the common views stay fast.
- Warning/error diagnostics can be shipped to an external webhook for hosted observability.
- Authentication is first-party: password hashes and sessions are owned by the app rather than an external auth provider.
- Auth sign-in/sign-up are rate-limited to slow down brute-force and abuse attempts.
- Stripe webhook deliveries are deduplicated so replayed events do not double-apply billing state.

## Testing

The main automated checks are:

- unit tests for storage, diagnostics, reconciliation, and production-hardening logic
- ESLint for source quality
- browser smoke testing for the concierge flow

## Deployment

ScopeOS is designed for Vercel deployment with MongoDB, Stripe, and optional Blob storage.

Before release, verify:
- MongoDB connectivity and indexes are healthy
- env vars are set in the target environment
- attachment downloads work with your chosen storage backend
- the observability webhook is reachable if you enable it

See `docs/ops/production-hardening.md` for the production safety checklist, backup/restore drill, and operational limits.

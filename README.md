# ScopeOS

ScopeOS is an AI-assisted scoping and proposal workflow app for turning incoming opportunities into structured risk checks, extraction reviews, and proposal packs.

## What it does

- Capture a job or brief
- Run a risk check
- Generate an AI-assisted extraction review
- Generate an AI-assisted proposal pack
- Track saved AI runs and provider metadata
- Support both deterministic fallback output and NVIDIA-backed AI generation

## Tech stack

- Next.js
- React
- TypeScript
- Neon Auth / Neon Postgres
- Stripe billing
- NVIDIA AI endpoint support

## Local setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create your local env file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the required values in `.env.local`.

## Environment variables

Required variables are documented in `.env.example`:

- `DATABASE_URL`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO_MONTHLY`
- `STRIPE_PRICE_TEAM_MONTHLY`
- `APP_BASE_URL`
- `NVIDIA_API_BASE_URL`
- `NVIDIA_API_KEY`
- `NVIDIA_MODEL`

## Run locally

```bash
pnpm dev
```

## Quality checks

```bash
pnpm lint
pnpm test
pnpm build
```

Useful smoke / eval commands:

```bash
pnpm smoke:browser
pnpm eval:ai
```

## Deployment

This app is intended to run on Vercel.

- Production build: `pnpm build`
- Local production run: `pnpm start`
- Configure production env vars in the Vercel dashboard

## Additional docs

- [Launch handoff](docs/launch-handoff.md)
- [Project brief](PROJECT_BRIEF.md)
- [Tasks](TASKS.md)

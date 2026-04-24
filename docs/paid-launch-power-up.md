# ScopeOS Paid-Launch Power-Up

Implemented on April 24, 2026.

## Shipped

- Public trust and SEO pages:
  - `/privacy`
  - `/terms`
  - `/about`
  - `/case-studies`
  - `/compare`
- Public product proof:
  - `/demo`
  - `/sample-proposal-pack`
- Workspace activation:
  - onboarding checklist
  - persisted workspace brand settings
  - branded proposal export uses saved brand colors/name/footer
- Account hardening:
  - team members with `owner`, `admin`, and `member` roles
  - invite, revoke, role update, remove-member APIs
  - invite acceptance route
  - password reset request/confirm flow
  - hashed reset tokens, one-time use, expiry, and session revocation
- Env additions:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL`

## Required production env before using email flows

Set these in Vercel for Production and Preview:

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
APP_BASE_URL=https://scope-wheat.vercel.app
```

Password reset still returns a safe generic response if Resend is missing, but no email will be sent.

## Smoke checklist after deploy

- `/demo`
- `/sample-proposal-pack`
- `/privacy`
- `/terms`
- `/about`
- `/compare`
- `/case-studies`
- email/password sign-in
- Google sign-in
- forgot-password request with Resend configured
- reset-password confirm from email link
- `/account` brand save
- `/account` team invite/revoke
- branded proposal export
- `/api/health`
- `/ops`

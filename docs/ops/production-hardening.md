# ScopeOS Production Hardening Runbook

> Practical guardrails for operating the MongoDB + first-party auth stack in production.

## What is already in place

- **MongoDB-backed auth and workspace data**
- **Auth rate limiting**
  - sign-in: IP and email buckets
  - sign-up: IP and email buckets
- **Health endpoint**
  - `GET /api/health`
  - returns Mongo/auth readiness plus feature-flag status
- **Observability and alerts**
  - warning/error diagnostics can be shipped to an observability webhook
  - error diagnostics can also be shipped to an alert webhook
- **Incident visibility dashboard**
  - `/ops` shows the current health snapshot plus recent warnings and errors
  - access is controlled by the `OPS_OPERATOR_EMAILS` allowlist
- **Background cleanup worker**
  - deal attachment cleanup is queued and processed by a Vercel Cron job
- **Stripe webhook dedupe**
  - duplicate deliveries are ignored safely
  - processed/failed webhook events are tracked in MongoDB
- **TTL-backed cleanup**
  - rate-limit buckets expire automatically
  - webhook event history expires automatically
- **Account security**
  - password changes invalidate every active session
  - the sign-in page shows a success message after a password reset/change

## Phase 1: Data safety baseline

### Canonical app URL

Production should use:

- `APP_BASE_URL=https://scope-wheat.vercel.app`

Preview deployments can safely fall back to the request origin. The application also ignores a
stale localhost `APP_BASE_URL` when handling non-local production/preview requests so OAuth and
Stripe redirects do not drift back to local development.

### Rotate the exposed MongoDB password

If a database password has been shared anywhere outside Atlas, rotate it:

1. Open MongoDB Atlas.
2. Edit the database user used by ScopeOS.
3. Set a new password.
4. Update `MONGODB_URI` in Vercel.
5. Redeploy production.

### Backups and restore drill

Use Atlas backup/restore for production data safety.

Minimum workflow:

1. Confirm backups are enabled for the cluster.
2. Create or select a staging restore target.
3. Restore a recent snapshot to the staging copy.
4. Point a staging deployment at the restored MongoDB URI.
5. Verify:
   - sign-up
   - sign-in
   - sign-out
   - `/risk-check`
   - `/pricing`
   - `/account`
6. Record the restore result and timestamp.

### Drill scripts

ScopeOS also includes local JSON backup/restore helpers to make the drill repeatable:

- `pnpm db:backup -- --base-dir backups --name staging-drill`
- `pnpm db:restore -- --backup-dir backups/staging-drill --drop-existing`
- `pnpm db:drill` to back up the source DB, restore into a staging target, and compare the restored manifest

These scripts are intended for staging copies and restore drills, not as a replacement for Atlas native backups.

To run the automated drill, set:

- `DRILL_MONGODB_URI`
- `DRILL_MONGODB_DB_NAME`

Recommended drill flow:

1. Export a known-good staging snapshot.
2. Restore it into a fresh staging database.
3. Point a staging deployment at the restored URI.
4. Verify the critical flows again.
5. Delete the temporary staging copy when the drill is complete.

## Phase 2: Abuse protection

### Auth rate limits

Current defaults:

- sign-in IP bucket: **8 attempts / 15 minutes**
- sign-in email bucket: **5 attempts / 15 minutes**
- sign-up IP bucket: **5 attempts / 1 hour**
- sign-up email bucket: **3 attempts / 1 hour**

The API returns HTTP `429` and a `Retry-After` header when a bucket is exhausted.

### Operational note

These limits are intentionally modest. If legitimate users hit them too often, raise them carefully rather than disabling them.

## Phase 3: Runtime health checks

### Health endpoint

Use `GET /api/health` for:

- load balancer / uptime checks
- quick production verification
- staging sanity checks after deploys

Expected behavior:

- `200` when MongoDB is reachable and auth is configured
- `503` when MongoDB is missing or unreachable
- the health payload also reports whether observability and alerting webhooks are configured
- the health payload also reports whether the maintenance cron secret is configured

### What to inspect if health is red

1. `MONGODB_URI` / `MONGODB_DB_NAME`
2. MongoDB Atlas network access
3. Atlas cluster status
4. Vercel deployment logs
5. Alert webhook configuration if you expect failure notifications
6. `CRON_SECRET` if you expect background cleanup jobs to run automatically

## Phase 4: Stripe webhook reliability

### Duplicate deliveries

Stripe webhook events are stored by event id.

- repeated deliveries are treated as duplicates
- processed events are not re-applied
- failed events can be retried

### Replay procedure

If a webhook needs to be reprocessed:

1. Fix the underlying issue first.
2. Re-send the Stripe event from the Stripe dashboard or CLI.
3. Confirm the event transitions from `failed` to `processing` to `processed`.
4. Verify the workspace billing state changed as expected.

Targeted regression tests:

- `pnpm exec vitest run src/lib/stripe-webhook-events.test.ts src/lib/stripe-billing-sync.test.ts`

## Incident visibility dashboard

### What `/ops` shows

- current Mongo/auth/Stripe/cron/observability readiness
- recent warnings and errors mirrored into MongoDB
- operator links back to the health JSON and account surface

### How to use it

1. Sign in with an operator account.
2. Open `/ops`.
3. Check the overall status card first.
4. Read the most recent warnings or errors.
5. Open `/api/health` if you want the raw JSON snapshot.

## Phase 5: Background cleanup worker

### What gets offloaded

- attachment file/blob deletion after deal removal

### How it works

1. The API deletes the database records immediately.
2. The attachment cleanup is written to `background_tasks`.
3. Vercel Cron calls `/api/maintenance/background-tasks` once per day on Hobby plans.
4. The worker claims pending tasks, deletes the attachment, and marks the task succeeded.

If you upgrade to a Vercel Pro plan later, you can tighten the cron cadence by updating `vercel.json`.

### If cleanup fails

- The task is retried with backoff.
- A failed cleanup job is logged as an error diagnostic.
- Check the cron secret, task queue state, and attachment backend if failures repeat.

## Phase 6: Data lifecycle discipline

### MongoDB collections with TTL cleanup

- `auth_rate_limits`
- `stripe_webhook_events`
- `background_tasks`

These collections are automatically pruned by MongoDB TTL indexes.

### Suggested retention policy

- Rate-limit buckets: keep only for the active window
- Webhook event history: keep enough for debugging, then expire automatically
- Background tasks: keep successes/failures long enough to debug, then expire automatically

### Schema changes

When adding or changing document fields:

1. Update the TypeScript type.
2. Add or adjust indexes.
3. Add a migration script if existing documents need transformation.
4. Test against a copy of production data before shipping.

See `docs/ops/data-lifecycle.md` for ownership, retention, and migration defaults.

## Support and manual recovery

- Public support routing lives at `/support`.
- Authenticated pilot feedback lives at `/feedback`.
- Password reset email is deferred; use the manual recovery procedure in
  `docs/ops/operator-runbook.md` during the pilot.

## Operator checklist

Before shipping a production change:

- [ ] Health endpoint returns `200`
- [ ] Alert webhook is configured if you want critical error notifications
- [ ] `CRON_SECRET` is configured if you want background cleanup to run automatically
- [ ] `OPS_OPERATOR_EMAILS` is configured if you want the `/ops` dashboard to be operator-only
- [ ] Account page password-change flow works and revokes all sessions
- [ ] Auth sign-up and sign-in still work
- [ ] Rate limits behave as expected
- [ ] Stripe webhook replay is safe
- [ ] Backup restore procedure has been exercised recently
- [ ] Vercel env vars match the current Atlas cluster

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
- **Stripe webhook dedupe**
  - duplicate deliveries are ignored safely
  - processed/failed webhook events are tracked in MongoDB
- **TTL-backed cleanup**
  - rate-limit buckets expire automatically
  - webhook event history expires automatically

## Phase 1: Data safety baseline

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

These scripts are intended for staging copies and restore drills, not as a replacement for Atlas native backups.

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

### What to inspect if health is red

1. `MONGODB_URI` / `MONGODB_DB_NAME`
2. MongoDB Atlas network access
3. Atlas cluster status
4. Vercel deployment logs

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

## Phase 5: Data lifecycle discipline

### MongoDB collections with TTL cleanup

- `auth_rate_limits`
- `stripe_webhook_events`

These collections are automatically pruned by MongoDB TTL indexes.

### Suggested retention policy

- Rate-limit buckets: keep only for the active window
- Webhook event history: keep enough for debugging, then expire automatically

### Schema changes

When adding or changing document fields:

1. Update the TypeScript type.
2. Add or adjust indexes.
3. Add a migration script if existing documents need transformation.
4. Test against a copy of production data before shipping.

## Operator checklist

Before shipping a production change:

- [ ] Health endpoint returns `200`
- [ ] Auth sign-up and sign-in still work
- [ ] Rate limits behave as expected
- [ ] Stripe webhook replay is safe
- [ ] Backup restore procedure has been exercised recently
- [ ] Vercel env vars match the current Atlas cluster

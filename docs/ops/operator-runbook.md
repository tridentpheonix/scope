# ScopeOS Operator Runbook

Use this when production behavior looks wrong.

## 1. Check live health

Open:

- `https://scope-wheat.vercel.app/api/health`
- `https://scope-wheat.vercel.app/ops`

Expected:

- health returns `ok: true`
- MongoDB and auth are ready
- Stripe is configured before paid checkout is promoted
- `/ops` is visible only to emails in `OPS_OPERATOR_EMAILS`

## 2. Triage failed sign-in

1. Ask whether the user used Google or email/password.
2. If email/password fails repeatedly, check for rate limiting and wait for the retry window.
3. If the user has a Google account with the same verified email, ask them to try Google sign-in.
4. If recovery is still needed, verify the user out of band before changing anything.
5. Do not disable rate limiting to fix a single support issue.

## 3. Manual password recovery

Password reset email is intentionally not enabled yet.

Pilot-safe recovery process:

1. Verify the account owner outside the app.
2. Confirm the account email and workspace.
3. Use an operator-controlled script or MongoDB admin action to set a new password hash only if a recovery utility exists for the current release.
4. Revoke active sessions after the password change.
5. Ask the user to sign in and immediately change the password from `/account`.

If no reviewed recovery utility exists, prefer Google sign-in or create a replacement account rather than editing auth documents by hand.

## 4. Confirm Stripe webhook status

1. Open the Stripe dashboard.
2. Inspect the latest events for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
3. If Stripe retried an event, check `/ops` for webhook warnings/errors.
4. Replay only after fixing the underlying failure.
5. Confirm the workspace plan and subscription status on `/account`.

Webhook handling is expected to be idempotent: replayed processed events should not duplicate billing state.

For a live endpoint replay smoke that does not change a real subscription, run:

```powershell
$env:LIVE_STRIPE_WEBHOOK_SECRET="<production webhook signing secret>"
pnpm smoke:stripe-webhook
```

Expected result:

- the first synthetic event returns `ok: true`
- the replay of the same event returns `duplicate: true`
- `/ops` shows the processed event in the billing webhook ledger

Never paste the webhook secret into chat or commit it to the repo.

## 5. Restore data drill

Use Atlas native backup/restore for production recovery.

For a staging drill:

1. Restore a recent Atlas snapshot into a staging cluster or staging database.
2. Set `DRILL_MONGODB_URI` and `DRILL_MONGODB_DB_NAME`.
3. Run `pnpm db:drill`.
4. Point a staging deployment at the restored database.
5. Smoke sign-in, `/risk-check`, `/account`, `/pricing`, and `/api/health`.

Do not point a restore drill at the production database.

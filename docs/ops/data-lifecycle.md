# ScopeOS Data Lifecycle and Migration Notes

## Document ownership

- `users`, `sessions`, and auth rate limits belong to the first-party auth boundary.
- `workspaces` belongs to workspace/billing state.
- risk-check, extraction-review, proposal-pack, deals, and feedback collections belong to the product workflow.
- `stripe_webhook_events` belongs to billing reliability.
- `background_tasks` belongs to async cleanup/reconciliation.

## Retention defaults

- Auth rate-limit buckets: expire through TTL indexes after the active window.
- Stripe webhook event records: keep long enough for replay/debug, then expire through TTL.
- Background task records: keep successes/failures long enough for incident review, then expire through TTL.
- Pilot feedback: keep during the pilot; archive or delete before public launch if it contains sensitive client material.
- Deleted deal attachments: database records are removed first, blob cleanup is retried asynchronously.

## Schema changes

Every schema/document change should include:

1. Type update in the owning module.
2. Index update if query shape changes.
3. Backward-compatible readers for old documents.
4. Migration script only when old documents must be transformed.
5. Rollback note describing how to tolerate partially migrated data.

## Migration safety checklist

- Test against a copy of production-like data.
- Make writes forward-compatible before requiring migrated reads.
- Prefer additive fields over destructive renames.
- Keep old documents readable until the migration is verified.
- Record the migration command, timestamp, and target database in the launch handoff or ops notes.

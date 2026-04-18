# ScopeOS Pilot Feedback Playbook

Use this after the initial release polish is complete and real users start touching the product.

In the app, the intake surface lives at `/feedback`.

## Goal

Capture the smallest useful set of signals that tell us:

- where users get stuck
- which parts of the workflow feel slow or unclear
- whether client-material storage and download flows are reliable
- whether billing, auth, or AI fallback behavior creates friction

## What to collect

For each issue or comment, capture:

- **Workspace**
- **User**
- **Deal / submission ID**
- **Where it happened**
- **What the user tried to do**
- **What they expected**
- **What actually happened**
- **Severity**
- **Reproducibility**
- **Screenshot or note**

## Severity bands

- **Blocker** — user cannot finish the core flow
- **High** — user can finish only with a workaround
- **Medium** — workflow is confusing or slow, but usable
- **Low** — copy, polish, or small convenience issue

## Triage buckets

Use these tags when a pilot item arrives:

- `auth`
- `billing`
- `intake`
- `ai`
- `deals`
- `analytics`
- `maintenance`
- `performance`
- `copy`
- `data-integrity`

## Questions to ask pilot users

Ask in plain language:

1. What were you trying to do?
2. What got in your way?
3. Did anything feel slow, confusing, or untrustworthy?
4. Could you download client materials when you needed them?
5. Did the AI output feel usable or did it need manual correction?
6. Was billing/account access clear?
7. If you had one change request, what would it be?

## Collection workflow

1. Capture the issue in a single place.
2. Add the severity and bucket.
3. Link the related submission or deal.
4. Check the diagnostic stream if the issue involved a failure.
5. Decide whether it needs:
   - a bug fix
   - a copy/UX adjustment
   - a workflow change
   - a longer-term product decision

## Good pilot signals

These are the most valuable signals to watch for:

- repeated downloads failing
- users not understanding which AI output is final
- users missing where to go after the launchpad
- billing confusion before checkout
- any sign of cross-workspace data confusion
- any orphaned upload or missing attachment case

## What not to overreact to

- single-user preference comments
- one-off stylistic opinions
- issues caused by old browser caches or stale dev sessions

## Exit criterion

Pilot feedback is “good enough” when:

- the core workflow is being completed without help
- no blocker repeats across users
- the remaining comments are mostly polish, copy, or preference

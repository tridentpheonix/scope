# Concierge test report

Date: 2026-04-11

## Goal
Pressure-test the current Scope Risk Check intake with three realistic SMB website redesign briefs before building deeper proposal logic.

## Cases run
1. Industrial B2B marketing redesign with unclear copy ownership, HubSpot form questions, and possible CMS migration.
2. Law firm WordPress redesign with blog migration, ADA concerns, and SEO redirect ambiguity.
3. Home services Webflow rebuild with loose revision scope, asset-readiness risk, and possible post-launch automation creep.

## What passed
- All three realistic briefs made it through the current intake validation successfully.
- The current form captures enough structured detail for a manual founder review.
- The file-backed concierge flow supports both paste-only intake and intake with a supporting brief attachment.

## What these tests surfaced
- Copy ownership keeps showing up as a pricing risk, especially when clients expect messaging help but have not staffed it.
- Migration work is a repeat blind spot: blog moves, redirects, plugin cleanup, and CMS assumptions can all expand effort fast.
- Revision boundaries and asset readiness are still easy to leave vague, especially on fast-turnaround redesigns.
- Integrations are still underspecified in realistic briefs, even when the client says they only want a "simple marketing site."

## Product implication for the next build step
- Keep the intake narrow, because it is already good enough for manual-first validation.
- Use the repeated gaps above to drive S5: missing-info detection and pricing-tier logic for website redesign work.
- When S6 is built, preserve internal risk notes separately from client-facing export output.

## Build evidence
- Automated concierge tests now cover the three realistic website redesign cases.
- Tests use isolated temp storage so the realistic submissions can be exercised without polluting live intake data.
- ScopeOS now turns those same patterns into stored missing-info prompts, risk flags, and pricing guidance immediately after intake submission.

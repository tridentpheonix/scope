# ARTIFACTS — Phase 01: Marketing + free Scope Risk Check entry

## Phase Goal
Convert qualified small web design agency visitors into real Scope Risk Check submissions without broadening the product beyond SMB website redesign scoping.

## Primary User Outcome
The founder or account lead quickly understands that ScopeOS protects margin on messy website briefs and feels confident enough to submit one real brief or request a free Scope Risk Check.

## Entry Trigger
The user arrives from a LinkedIn/X teardown post, referral, founder DM, or a direct link tied to website scoping pain.

## Inputs
- Existing landing-page copy and product thesis from `LANDING_PAGE_COPY.md`
- ICP assumptions for small web design agencies
- Free Scope Risk Check offer framing
- Contact details supplied by the visitor
- Optional pasted brief summary or short project description

## Outputs
- Qualified lead submission tied to the Scope Risk Check offer
- Disqualified or low-fit submission tagged with reason
- Captured contact context for follow-up
- Clear next-step expectation for manual review or response

## Artifact Inventory
- Hero promise focused on messy website briefs and margin protection
- One primary CTA: free Scope Risk Check
- Lead capture form with contact + brief summary fields
- Qualification rules for website-project fit
- Proof/objection blocks that reinforce why ScopeOS beats ChatGPT + templates
- Submission acknowledgment state with next-step timing

## Core Behaviors
- Present a niche-specific landing page that speaks directly to web design proposal pain.
- Capture enough information to determine whether the lead is a fit for the ScopeOS wedge.
- Gate the free offer toward brochure/marketing website projects rather than broad agency services.
- Explain that the first review is manual and that nothing is auto-sent to clients.
- Route qualified submissions into the brief intake / concierge follow-up path.

## Validation / Failure Cases
- Reject submissions with no usable contact method.
- Reject or flag requests that are clearly outside the wedge, such as enterprise procurement flows or unrelated agency services.
- Flag submissions with too little project context to perform a meaningful Scope Risk Check.
- Show a recoverable error state if form submission fails so the user can retry without rewriting everything.

## Metrics / Events
- `landing_viewed`
- `cta_scope_risk_check_clicked`
- `risk_check_form_started`
- `risk_check_submitted`
- `risk_check_qualified`
- `risk_check_disqualified`
- Success metric: qualified risk-check submissions per 100 landing visitors

## Dependencies
- `LANDING_PAGE_COPY.md` messaging
- ICP assumptions in `CUSTOMERS.md`
- Manual founder follow-up process for early concierge delivery
- Simple form capture and event tracking layer

## Exit Criteria
- The user has submitted a qualified Scope Risk Check request or a real brief.
- The product has enough lead data to either start intake or follow up manually.
- The next step is explicit: continue into intake, await manual review, or exit as not a fit.

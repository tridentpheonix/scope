# DESIGN — Phase 01: Marketing + free Scope Risk Check entry

## Concept
A trust-forward SaaS landing page that feels premium enough to signal competence but restrained enough to feel like serious operational tooling for small web design agencies.

## Aesthetic
Restrained dark luxury plus minimalism. Use a near-black canvas, soft radial depth, thin low-opacity borders, and one electric blue accent so the page feels calm, precise, and expensive without becoming flashy.

## Layout
Hero + proof grid. Structure the page as: sticky nav, hero with CTA, pain/ROI strip, how-it-works explainer, proof + objections grid, founding offer block, FAQ, and final CTA.

## Motion
Subtle scroll reveal only. Use fade-up section reveals, light card elevation on hover, and a restrained navbar transition from transparent to frosted. No parallax, no long chained animations.

## Typography
Use a geometric grotesk for headlines and a neutral product sans for body copy. Headlines should feel confident and compressed; body text should stay highly legible and founder-readable.

## Color
- Background: deep charcoal / slate-black
- Primary text: near-white
- Secondary text: cool gray
- Accent: electric blue used sparingly for CTA, progress cues, and links
- Support tone: muted green only for trust/confirmation moments

## Navigation
Sticky navbar with logo left, problem-to-solution links centered, and a clear CTA on the right. On scroll, shift from transparent to lightly frosted. Under mobile, collapse to a simple menu with the CTA always visible near the top.

## Key UI Patterns
- High-contrast hero with one embedded CTA path
- Proof / objection cards with compact copy
- One lead-capture entry pattern, not multiple competing forms
- Pain-to-outcome comparison row
- FAQ accordion for trust and objection handling
- Compact founding-offer block with turnaround expectation

## Mobile Behavior
Stack the hero vertically, keep the CTA above the fold, compress proof cards into a swipe-free vertical flow, and keep copy short enough that the page still feels fast and decisive under 768px.

## State Design
- **loading:** CTA submit shows inline spinner and disabled state without shifting layout.
- **empty:** if there is no customer proof yet, swap in anonymized workflow examples and founder credibility instead of leaving blank proof space.
- **error:** form errors appear inline near the field and in a summary block near the CTA; retry keeps typed content intact.
- **success:** replace the form area with a calm confirmation panel that explains exactly what happens next and how quickly the founder will respond.

## Trust Cues
- State clearly that ScopeOS is built for small web design agencies, not generic proposal writing.
- Explain that the first review is manual and that nothing is sent to the client automatically.
- Add privacy reassurance around submitted briefs.
- Use specific language around scope creep, revisions, CMS migration, and content ambiguity to prove domain fit.

## Screen Notes
- Keep the landing page purpose singular: convert interest into a real brief or risk-check submission.
- Avoid overloading the page with product roadmap language, integrations, or enterprise claims.
- The final CTA should mirror the hero CTA so the page feels coherent and decisive.

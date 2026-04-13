# DESIGN — Phase 03: Extraction review + risk confirmation

## Concept
A precision review workbench that helps the founder judge whether the machine understood the brief correctly before any pricing or proposal language is created.

## Aesthetic
Precision tooling. The interface should feel analytical, calm, and trustworthy, with restrained density and clear information hierarchy instead of decorative polish.

## Layout
Split-pane or list/detail review surface on desktop. Use the main area for extracted scope fields and a persistent side rail for risk summary, unanswered questions, and generation readiness. On smaller screens, stack these into deliberate sections.

## Motion
Minimal fade/slide transitions only. Use motion to reveal expanded field details, edited states, and confirmation steps, not to entertain.

## Typography
Use compact section headers, quiet metadata labels, and strong emphasis for risk severity and inferred content. The reading experience should feel like reviewing a structured analysis document, not a marketing page.

## Color
- Background: cool light-neutral or muted slate depending on shell
- Panels: white / soft neutral with thin borders
- Text: high-legibility charcoal
- Accent: restrained blue for editable/confirmed states
- Risk colors: amber and muted red for urgency, used sparingly and consistently

## Navigation
Use a contained app shell with a simple progress label and next-step action. Avoid broad app navigation that dilutes the review focus.

## Key UI Patterns
- Split-pane review cards
- Confidence and provenance chips
- Editable inline field rows
- Grouped risk cards by severity or type
- Confirmation checklist before generation
- Regenerate / retry control with edit-preservation warning

## Mobile Behavior
Stack the workbench into sections with a pinned or always-visible risk summary module near the top. Put primary confirmation actions in a sticky bottom area so the user does not need to scroll back to proceed.

## State Design
- **loading:** show a stable skeleton for extracted fields and a visible progress label while analysis completes.
- **empty:** if extraction returns too little usable detail, present a structured missing-info panel instead of a blank screen.
- **error:** extraction failures should show plain-language cause, retry action, and assurance that source material is still preserved.
- **success:** after confirmation, show a calm readiness state that explains proposal generation is now based on the reviewed scope.

## Trust Cues
- Mark every field as source-backed or inferred.
- Explain why each risk matters in proposal accuracy or margin protection.
- Make edits visibly user-owned so the founder knows corrections are preserved.
- Keep internal review language distinct from anything client-facing.

## Screen Notes
- This screen is the product's trust hinge; do not compress it into a hidden intermediate step.
- Make the review surface dense enough to be useful but not overwhelming.
- The confirm action should feel deliberate and earned, not automatic.

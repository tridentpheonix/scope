# DESIGN — Phase 04: Proposal pack generation + editing

## Concept
A document workbench that makes AI output feel reviewable and controllable, helping the founder move from confirmed scope to sendable proposal material without losing trust in the system.

## Aesthetic
Editorial minimalism plus product tooling. The interface should feel like a calm writing surface wrapped in a disciplined operational shell.

## Layout
Tabbed or sectional editor with a persistent summary rail. Use the main canvas for content editing and the side rail for pack status, pricing summary, risk reminders, and next-step actions.

## Motion
Minimal. Use only small transitions for tab switches, save states, and copy/export confirmations. Avoid heavy document-like animations.

## Typography
Use an editorial-feeling hierarchy inside the document surface and a compact UI hierarchy in the surrounding controls. Proposal content should feel polished; control chrome should stay quiet.

## Color
- Outer shell: muted slate / soft dark neutral
- Document surface: white or warm neutral
- Primary text: rich charcoal
- Accent: restrained blue for actions, tabs, and save states
- Secondary emphasis: muted amber only for unresolved issues

## Navigation
Use a contained app header with deal name, pack status, and one clear primary action. Within the workbench, navigation should happen via tabs or anchored sections rather than a broad multi-level nav.

## Key UI Patterns
- Section editor blocks
- Pricing tier cards or comparison strip
- Internal vs client-facing toggle
- Persistent summary rail
- Inline save/copy feedback
- Regenerate with overwrite awareness

## Mobile Behavior
Collapse the editor into section-by-section blocks with a sticky primary action bar. Move the persistent summary rail into a top accordion or bottom sheet so the main content remains readable on small screens.

## State Design
- **loading:** show skeleton document sections and a stable generation progress state.
- **empty:** if no pack exists yet, show the reviewed-scope summary and a single clear action to generate the first draft.
- **error:** generation errors must preserve the prior draft or section state and offer retry without fear of content loss.
- **success:** successful generation and save states should appear as calm inline confirmations, not disruptive modal interruptions.

## Trust Cues
- Make it obvious which text is client-facing and which text is internal guidance.
- Show save/regeneration behavior clearly so the founder knows edits are protected.
- Keep unresolved scope warnings visible while editing.
- Reinforce that the output is a draft for commercial review, not legal advice.

## Screen Notes
- The workbench should feel decisive, not like a generic text editor.
- Pricing, exclusions, and assumptions deserve visual emphasis because they drive margin protection.
- The UI should optimize for fast founder review, not collaborative editing complexity.

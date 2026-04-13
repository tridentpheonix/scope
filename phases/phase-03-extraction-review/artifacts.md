# ARTIFACTS — Phase 03: Extraction review + risk confirmation

## Phase Goal
Convert the accepted brief into a structured, editable scope review where the user can confirm inferred information and resolve critical ambiguities before proposal generation.

## Primary User Outcome
The user sees a clean extraction of goals, deliverables, assumptions, missing information, and risk flags, then approves a reviewed scope payload for generation.

## Entry Trigger
A valid intake session has completed and the extraction engine has produced the first structured interpretation of the brief.

## Inputs
- Normalized brief package from intake
- Extraction output for goals, deliverables, scope clues, and dependencies
- Missing-info taxonomy
- Risk taxonomy with category labels
- Source references / provenance markers

## Outputs
- Reviewed scope record
- Confirmed or edited assumptions
- Acknowledged risk flags and unanswered questions
- Generation payload ready for proposal-pack creation

## Artifact Inventory
- Extracted field set with source-backed vs inferred labels
- Missing-info checklist
- Risk summary grouped by type
- Confidence / certainty markers
- Editable assumption fields
- Confirmation state for generation readiness

## Core Behaviors
- Surface extracted client goals, likely deliverables, page or feature clues, platform clues, and responsibilities.
- Distinguish clearly between what came from the source and what ScopeOS inferred.
- Let the user edit extracted data before generation.
- Require acknowledgment of high-risk ambiguities that could distort pricing.
- Allow a controlled regenerate/retry path if extraction quality is poor.

## Validation / Failure Cases
- Flag when extraction yields too many unknowns to generate a safe proposal pack.
- Flag contradictory source signals, such as conflicting timelines or platform choices.
- Prevent generation if essential risk acknowledgments are incomplete.
- Show a stable retry/regenerate path if extraction fails or returns low-confidence output.
- Preserve prior user edits where possible when extraction is retried.

## Metrics / Events
- `extraction_completed`
- `extraction_field_edited`
- `risk_flag_viewed`
- `risk_acknowledged`
- `extraction_regenerated`
- `extraction_confirmed`
- `extraction_failed`
- Success metric: confirmed reviewed scopes per completed intake

## Dependencies
- Phase 02 intake output
- Extraction logic and prompt templates
- Risk taxonomy and missing-info rules from the PRD
- Edit persistence for review changes

## Exit Criteria
- The user has a reviewed scope they trust enough to use for generation.
- High-risk unknowns are either acknowledged or corrected.
- The system has a confirmed generation payload with explicit assumptions.

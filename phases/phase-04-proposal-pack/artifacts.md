# ARTIFACTS — Phase 04: Proposal pack generation + editing

## Phase Goal
Generate the full scoped proposal pack from the reviewed scope and let the user refine it until it is usable with light edits for a real client opportunity.

## Primary User Outcome
The user receives a complete proposal pack with pricing tiers, SOW, exclusions, assumptions, clarification questions, and change-order starter language that can be finalized without rebuilding from scratch.

## Entry Trigger
The user has confirmed the reviewed scope and initiated proposal-pack generation.

## Inputs
- Confirmed generation payload from extraction review
- Pricing style selection
- Section templates for proposal, SOW, exclusions, and change-order language
- Any user edits or defaults preserved from previous steps

## Outputs
- Generated proposal pack draft
- Three pricing tiers
- Detailed SOW
- Assumptions and exclusions set
- Clarification questions to send the client
- Saved editable pack record

## Artifact Inventory
- Deal summary and goals
- Website scope snapshot
- Pricing tiers
- Detailed SOW structure
- Assumptions / exclusions model
- Clarification questions list
- Change-order starter language
- Edit state / saved draft status

## Core Behaviors
- Generate every required section of the proposal pack in one pass.
- Separate internal working notes from client-facing copy.
- Allow inline edits by section without breaking the rest of the pack.
- Preserve user edits across regeneration where a section is not explicitly replaced.
- Support copy/export actions only after the pack is in a usable state.

## Validation / Failure Cases
- Flag if a required section is missing after generation.
- Prevent silent overwrites when regenerating after the user has edited content.
- Show a recoverable error if generation fails or times out.
- Warn when pricing tiers are inconsistent with the confirmed scope.
- Mark packs that still require major human rewrite as below the "usable with light edits" bar.

## Metrics / Events
- `pack_generation_started`
- `pack_generated`
- `pack_section_edited`
- `pack_regenerated`
- `client_view_toggled`
- `copy_action_used`
- `pack_generation_failed`
- Success metric: generated packs judged usable with light edits

## Dependencies
- Phase 03 confirmed reviewed scope
- Proposal-generation prompt and section template logic
- Edit persistence and saved draft storage
- Pricing-tier rules for the current website-project wedge

## Exit Criteria
- The user has a saved proposal pack with all required sections present.
- The pack meets the "usable with light edits" threshold.
- The pack is ready for export, reuse, or manual founder review.

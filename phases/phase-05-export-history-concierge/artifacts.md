# ARTIFACTS — Phase 05: Export, history, and concierge ops

## Phase Goal
Give the founder a lightweight operational surface for retrieving saved packs, exporting outputs, tracking status, and handling early concierge delivery without adding project-management bloat.

## Primary User Outcome
The founder can find the right proposal pack, copy/export it, resume editing, or complete a manual concierge review with clear deal status.

## Entry Trigger
At least one proposal pack draft exists and the founder needs to use it operationally after generation.

## Inputs
- Saved proposal pack drafts
- Deal metadata and status labels
- Founder review notes
- Export or copy actions initiated by the user
- Deletion/archive requests

## Outputs
- Copied or exported proposal content
- Updated pack status
- Resumed editing session
- Concierge review completion signal
- Archived or deleted pack/source material where requested

## Artifact Inventory
- Saved packs list/history model
- Status schema for draft, reviewed, sent, archived, etc.
- Copy/export actions
- Founder concierge checklist
- Resume/reopen behavior
- Pack deletion/archive controls

## Core Behaviors
- List and filter saved packs by deal or status.
- Reopen a saved pack into the editing flow.
- Support copy/export actions for client delivery workflows.
- Let the founder mark manual review steps during the concierge stage.
- Preserve a lightweight operational history without turning the product into a CRM.

## Validation / Failure Cases
- Handle missing or deleted packs gracefully.
- Show a clear error if export fails and preserve the pack state.
- Prevent ambiguous status changes when a pack is already archived or deleted.
- Warn before destructive delete actions for source material or pack records.
- Make it clear when history is empty so the user knows they need to generate a pack first.

## Metrics / Events
- `history_viewed`
- `pack_opened_from_history`
- `pack_exported`
- `pack_copied`
- `concierge_review_completed`
- `pack_resumed`
- `pack_deleted`
- Success metric: exported or resumed packs per generated pack

## Dependencies
- Phase 04 saved proposal pack record
- Status model and simple persistence layer
- Export formatting or copy handling
- Founder concierge operating process for early users

## Exit Criteria
- The founder can retrieve and use a saved pack without confusion.
- Export/copy actions are reliable enough for real client delivery.
- Manual concierge work is trackable without introducing CRM-style scope creep.

# DESIGN — Phase 05: Export, history, and concierge ops

## Concept
A sober operations dashboard that gives the founder just enough control to manage live proposal packs and early concierge work without turning ScopeOS into a bloated back-office system.

## Aesthetic
Sober operations UI. Keep the interface clean, quiet, and status-oriented with minimal decorative treatment and strong emphasis on retrieval, clarity, and next actions.

## Layout
List/detail with filters. Use a searchable or filterable history list on the left and a compact detail panel or checklist panel on the right. On smaller screens, collapse into a card list plus stacked detail view.

## Motion
No motion beyond practical transitions. Use gentle list/detail transitions, lightweight badge updates, and quiet confirmation states.

## Typography
Use compact operational typography with clear numeric/status emphasis. Keep labels concise and prioritize scanability over brand flourish.

## Color
- Background: light neutral or soft gray app shell
- Panels: white with thin borders
- Text: charcoal and dark slate
- Accent: restrained blue for selected rows, actions, and filters
- Status tones: muted green, amber, and gray used for state clarity only

## Navigation
Use a simple app header and local filters. The page should feel like the last operational step in the ScopeOS flow, not a new product mode.

## Key UI Patterns
- History list with filters
- Status badges
- Detail drawer or side panel
- Export/copy action group
- Concierge checklist panel
- Delete/archive confirmation pattern

## Mobile Behavior
Present packs as vertically stacked cards with status visible at a glance. Open details in a separate view or drawer, and keep export/resume actions sticky near the bottom for easy thumb access.

## State Design
- **loading:** show list skeletons and preserve filter chrome so the page still feels stable.
- **empty:** show a clear no-packs-yet state with a route back to proposal generation.
- **error:** failed export or retrieval states should appear inline near the affected pack and keep the history view intact.
- **success:** export, archive, and concierge-complete states should use compact inline confirmations and status badge updates.

## Trust Cues
- Make pack status explicit so the founder always knows what is draft vs reviewed vs sent.
- Keep delete/archive actions deliberate with confirmation language.
- Show when client material has been retained vs removed.
- Reinforce that this is a lightweight ops layer, not a system that auto-messages clients.

## Screen Notes
- Prioritize retrieval and actionability over analytics-heavy dashboards.
- Keep the page narrow in scope: history, export, resume, and concierge review.
- Avoid introducing broad account management or CRM concepts here.

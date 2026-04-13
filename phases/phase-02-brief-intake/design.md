# DESIGN — Phase 02: Brief intake

## Concept
A guided intake workspace that feels calm, trustworthy, and lightweight, helping the founder move from scattered source material to a valid extraction-ready brief in one short flow.

## Aesthetic
Minimal SaaS / operational tooling. Use a quiet interface with restrained contrast, deliberate spacing, and low-drama surfaces that make the act of uploading client material feel safe and controlled.

## Layout
Single-column guided form with step framing. Keep the flow linear: source type, content input, optional structured details, privacy/review notice, and submission. Reserve desktop width for readability rather than using dense multi-column forms.

## Motion
Near-static with microfeedback only. Use progress-state updates, subtle field highlighting, and soft confirmation transitions. Avoid decorative motion.

## Typography
Use the same product sans system as the rest of the app. Headings should be compact and direct; helper text should be smaller but still readable and never overly faint.

## Color
- Background: cool off-white or very light slate for the main form canvas
- Panel surfaces: white or soft neutral with thin borders
- Text: dark charcoal
- Accent: restrained blue for focus, completion, and CTA
- Error: muted red used only for validation and parse problems

## Navigation
Use a minimal application header with page title, step label, and optional back/save affordance. Avoid a full marketing navbar inside the intake experience.

## Key UI Patterns
- Paste/upload source switcher
- Large text area for brief input
- Dropzone for file upload
- Optional structured metadata group
- Inline validation rows
- Privacy / deletion notice box
- Clear primary action at the end of the intake flow

## Mobile Behavior
Convert the intake into a stepwise vertical flow. Keep all fields full-width, avoid side-by-side layouts, and keep the primary action sticky near the bottom once the user has entered meaningful content.

## State Design
- **loading:** file parsing and validation show a contained progress state with no jumpy layout changes.
- **empty:** show a short example brief and a concise explanation of accepted source types when no content is present.
- **error:** unreadable files, short inputs, or validation failures appear inline with plain-language recovery guidance.
- **success:** after acceptance, show a clear handoff panel that confirms the brief is ready and that extraction is starting next.

## Trust Cues
- Repeat that client material can be deleted.
- Explain supported sources and why extra structure helps generate a safer proposal pack.
- Mark optional fields clearly so the form does not feel bureaucratic.
- Remind the user that they will review inferred scope before anything client-facing is generated.

## Screen Notes
- Keep the page purpose singular: create one valid intake session for one website project.
- Avoid introducing proposal editing, pricing choices, or history views on this screen.
- The form should feel fast and forgiving rather than exhaustive.

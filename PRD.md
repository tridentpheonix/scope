# PRODUCT REQUIREMENTS DOCUMENT

## 1. Document Control
- **Project Name:** ScopeOS
- **Folder Name:** `01-scopeos`
- **Version:** 0.2
- **Status:** `draft`
- **Owner:** Satya
- **Last Updated:** 2026-04-10

## 2. Executive Summary
- **One-line product summary:** ScopeOS turns a messy website project brief, discovery call transcript, or Loom summary into a ready-to-edit scoped proposal pack with pricing options, SOW language, exclusions, and risk flags.
- **Who it is for:** 1-10 person web design agencies and freelancers selling SMB brochure or marketing website redesigns.
- **What painful problem it solves:** It removes the manual work and hidden risk involved in turning incomplete client inputs into a safe fixed-scope proposal.
- **Why this matters now:** Small agencies are under margin pressure, clients still arrive with messy briefs, and AI adoption is high enough that speed alone is no longer a differentiator; safer scoping is.
- **Why this product should exist instead of users using current tools or ChatGPT:** Existing proposal tools polish documents and collect signatures, while ChatGPT requires custom prompting and founder oversight; ScopeOS adds an opinionated website-scoping workflow with structured extraction, missing-info detection, exclusions, pricing structure, handoff-ready output, and safer review before pricing is shared.

## 3. Background and Context
- **Market context:** Small web design agencies live on fixed-fee project work, compete on responsiveness, and often lose margin because website projects are sold from messy discovery calls, informal notes, and incomplete briefs.
- **Current user workflow:** A founder or account lead runs a discovery call, pastes scattered notes into Google Docs or Notion, asks ChatGPT for a proposal draft, rewrites it using an old template, manually adds pricing and exclusions from memory, then sends it for client review.
- **Main frustration in the current workflow:** The brief is incomplete, so the proposal looks finished while key scope assumptions remain implicit.
- **What changed recently that makes this product timely:** Discovery calls are now commonly recorded and transcribed, agencies already use AI in fragmented ways, and tighter budgets make underpricing and unpaid revisions harder to absorb.
- **Strategic reason this project matters for the portfolio/business system:** ScopeOS is a strong wedge for the "AI operating systems for service businesses" portfolio because it ties workflow pain directly to ROI, shows clear PM tradeoffs, and can reach paid usage without enterprise complexity.

## 4. Problem Statement
- **Core problem statement:** Small web design agencies need a fast, repeatable way to turn messy discovery inputs into safe, sellable proposal packs without missing the assumptions and exclusions that protect margin.
- **Symptoms of the problem:**
  - Proposal creation takes 2-6 hours and depends on the founder or most senior seller.
  - Important website-scoping details such as content ownership, CMS migration, integrations, and revision limits are missing or only live in someone's head.
  - Scope creep begins before kickoff because deliverables and exclusions are not explicit when the client says yes.
- **Cost of not solving it:** Lost selling time, slower follow-up on hot leads, underpriced projects, unpaid revisions, stressful delivery handoffs, and lower confidence in fixed-fee quotes.
- **Who feels the pain most intensely:** Founders and account leads at 1-10 person web design agencies quoting roughly $3k-$30k SMB marketing website projects.

## 5. Target Users and Buyers
### Primary user
- **Role:** Founder, sales lead, or account lead at a small web design agency.
- **Goals:** Reply quickly to inbound website leads, scope with confidence, protect margin, and hand off sold work cleanly.
- **Pain points:** Messy discovery notes, inconsistent templates, forgotten assumptions, over-custom proposals, and fear of underpricing.
- **Current tools:** Google Docs, Notion, ChatGPT, old proposal templates, PandaDoc/Proposify/Better Proposals for final presentation.

### Buyer
- **Role:** Founder or agency owner.
- **Buying trigger:** Recent scope creep, proposal backlog, missed follow-up speed, or a painful underpriced website project.
- **ROI logic:** Saving 2-4 hours across 4-8 proposals per month plus preventing even one bad scope-creep incident makes the tool pay for itself many times over.

### Secondary users/stakeholders
- Delivery or project manager who inherits the sold scope.
- Designer/developer lead who needs clear deliverables, dependencies, and revision boundaries before kickoff.

## 6. Jobs To Be Done
- **Functional job:** Turn raw website discovery inputs into a proposal, SOW, exclusions list, pricing options, and clarification questions.
- **Emotional job:** Feel safe sending a fixed-fee quote without worrying that hidden work will appear later.
- **Social/job-to-be-seen-doing:** Present the agency as disciplined, professional, and operationally mature rather than improvising from notes.
- **When this job happens:** Right after a discovery call, after a client sends a loose brief or RFP, or when a follow-up proposal is needed quickly.
- **What successful completion looks like:** A ready-to-edit proposal pack exists in under 15 minutes, clearly shows what is included and excluded, and surfaces the few questions that still need an answer before final pricing.

## 7. Product Vision
- **Vision statement:** Build the scoping operating system for small web design agencies, starting with the highest-friction moment: turning messy discovery into a safe commercial proposal pack.
- **Initial wedge:** SMB brochure and marketing website redesign proposals for small web design agencies.
- **Long-term wedge expansion:** Add proposal memory, change-order workflows, niche packs for branding and performance marketing, and agency-specific clause libraries.
- **Why the wedge is defensible enough to matter:** Website scoping has repeatable structure and painful failure modes; the moat is domain-specific workflow, risk logic, and reusable commercial output, not generic AI writing.

## 8. Goals
### Business goals
- Get the first 3 paying customers from the web design niche within 30 days of launch.
- Prove that qualified users will submit real live deal briefs, not just test prompts.
- Establish a credible ROI story around time saved and scope-risk reduction that supports recurring pricing.

### User goals
- Create a first usable website proposal pack in less than 15 minutes.
- Catch missing scope details before pricing is shared with the client.
- Reuse a consistent structure that speeds handoff from sales to delivery.

### PM portfolio goals
- Show a clear niche-first product decision instead of a generic "AI for agencies" concept.
- Demonstrate prioritization tradeoffs by choosing risk protection over CRM breadth or proposal styling polish.
- Capture evidence of activation, repeat use, monetization, and user learning from real deals.

## 9. Non-Goals
- General-purpose proposal generation for every agency or service category.
- CRM, invoicing, e-signature, or full project management in v1.
- Enterprise collaboration, procurement workflows, approvals, or custom role systems.

## 10. User Stories
- As a web agency founder, I want to paste a messy discovery transcript and get a structured proposal pack, so that I can respond to a lead quickly without missing scope.
- As an account lead, I want ScopeOS to flag missing content, CMS, and integration details before I price, so that I do not underquote the project.
- As a delivery lead, I want the sold proposal to include assumptions, exclusions, and timeline boundaries, so that kickoff starts with less ambiguity.

## 11. User Journey
### Entry point
- **How the user first hears about the product:** LinkedIn or X teardown posts about bad website briefs, scope creep, and underpriced redesign projects.
- **Why they decide to try it:** They have a real website lead in front of them, the brief is messy, and a free Scope Risk Check feels directly useful.

### First-use flow
1. User lands on ScopeOS and chooses the "SMB Website Proposal Pack" flow.
2. User pastes a discovery call transcript, client brief, email chain, or Loom summary into one intake form.
3. ScopeOS extracts goals, deliverables, likely pages/features, assumptions, missing info, and risk flags; the user reviews and edits if needed.
4. User selects pricing style and generates a ready-to-edit proposal pack with proposal, SOW, exclusions, timeline, and change-order starter language.

### Output/value moment
- **What the first value moment is:** The user sees a complete draft proposal pack that already identifies hidden website-scope issues like content responsibility, CMS migration, integrations, revision limits, SEO expectations, and support boundaries.
- **What makes the user think "this is useful":** It catches 1-3 items they would normally discover later and gives them a client-ready starting draft in minutes instead of hours.

### Return loop
- **Why they come back:** Every new website lead starts from messy inputs, and the agency wants a faster, safer scoping baseline each time.
- **What repeated usage looks like:** The agency runs ScopeOS on each inbound website project, tweaks the draft, sends the proposal, and gradually makes ScopeOS part of its standard sales workflow.

## 12. MVP Scope
### MVP objective
- Help a small web design agency turn one real SMB website brief into a usable scoped proposal pack in under 15 minutes, with clear assumptions and exclusions that reduce scope-creep risk.

### Must-have features
1. Single intake flow for pasted website project briefs, transcripts, notes, or Loom summaries.
2. Website-specific extraction engine that identifies deliverables, missing inputs, assumptions, and risk flags.
3. Pre-generation review step where the user can confirm or edit extracted scope, assumptions, and missing-info flags.
4. Proposal pack generator with three pricing tiers plus detailed SOW, exclusions, timeline, and change-order starter language.
5. Inline review/edit experience with copy full pack + markdown export so agencies can move the draft into their existing Google Doc or proposal workflow immediately.
6. Branded export flow that produces a client-ready HTML/PDF draft via the browser print pipeline.

### Nice-to-have later
- Agency-specific defaults and reusable clause/template library.
- Proposal memory from previous accepted deals.
- Google Docs export integration or additional branded template themes.

### Explicit exclusions
- Multi-service agency support beyond website projects in v1.
- Automated contract sending, invoicing, or CRM sync.
- Full collaboration suite, permissions matrix, or approval chains.
- Direct Google Docs integration or auto-sent branded docs in v1.

### Phased Delivery Map
ScopeOS ships as a narrow 5-phase product flow for **small web design agencies serving SMB brochure and marketing website redesigns**. The sequence preserves the first-value moment: **brief in -> reviewed scope -> proposal pack out**.

1. **Phase 01 — Marketing + free Scope Risk Check entry**  
   Attract qualified web design agency leads, explain the value of safer scoping, and convert interest into one real brief submission.  
   Docs: [artifacts.md](phases/phase-01-marketing-risk-check/artifacts.md) | [design.md](phases/phase-01-marketing-risk-check/design.md)
2. **Phase 02 — Brief intake**  
   Capture pasted briefs, transcripts, and supported uploads with enough validation, privacy control, and structure to start extraction safely.  
   Docs: [artifacts.md](phases/phase-02-brief-intake/artifacts.md) | [design.md](phases/phase-02-brief-intake/design.md)
3. **Phase 03 — Extraction review + risk confirmation**  
   Turn messy source material into editable scope, missing-info prompts, and risk flags that the user confirms before proposal generation.  
   Docs: [artifacts.md](phases/phase-03-extraction-review/artifacts.md) | [design.md](phases/phase-03-extraction-review/design.md)
4. **Phase 04 — Proposal pack generation + editing**  
   Generate the scoped proposal pack, pricing tiers, SOW, exclusions, and clarification questions, then let the user refine the result with light edits.  
   Docs: [artifacts.md](phases/phase-04-proposal-pack/artifacts.md) | [design.md](phases/phase-04-proposal-pack/design.md)
5. **Phase 05 — Export, history, and concierge ops**  
   Help the founder retrieve saved packs, copy/export outputs, manage manual review, and track the status of live deals during early concierge usage.  
   Docs: [artifacts.md](phases/phase-05-export-history-concierge/artifacts.md) | [design.md](phases/phase-05-export-history-concierge/design.md)

## 13. Functional Requirements
List specific product requirements in this format:

- **FR1:** The product must support a first-use intake flow specifically for SMB website redesign/build proposals and label the niche clearly.
- **FR2:** The product must accept pasted text input and simple uploaded text documents/transcripts used in sales discovery, including common formats such as TXT, DOCX, and PDF exports.
- **FR3:** The system must extract and structure at minimum: project goal, site type, likely deliverables, page scope clues, CMS/platform clues, integrations, timeline clues, content responsibility, and revision expectations.
- **FR4:** The system must surface missing-information prompts and risk flags in clear categories before final output is generated.
- **FR5:** Each risk flag must be labeled as one of: missing input, scope ambiguity, delivery risk, or pricing risk.
- **FR6:** The system must let the user choose a pricing style and generate three pricing tiers anchored to the inferred scope.
- **FR7:** The system must generate a proposal pack with the exact v1 sections: scope snapshot, client goals, deliverables, assumptions, exclusions, timeline, pricing tiers, clarification questions, and change-order starter language.
- **FR8:** The system must generate a detailed SOW view that expands deliverables, rounds of revisions, dependencies, client responsibilities, and out-of-scope items.
- **FR9:** The system must allow the user to edit generated sections before copying or exporting them.
- **FR10:** The system must never auto-send outputs to clients; final review and send remains manual.
- **FR11:** The system must save the generated proposal pack inside the workspace so the user can revisit it during the active sales cycle.
- **FR12:** The system must show a clear disclaimer that outputs are commercial drafting assistance, not legal advice.
- **FR13:** The system must validate inputs before processing, including empty submissions, unsupported file types, unreadable files, and text that is too short to scope safely.
- **FR14:** The system must include a review step where inferred facts and assumptions can be accepted or corrected before final generation.
- **FR15:** The system must preserve user edits when the user regenerates or retries a failed generation wherever the edited section is not explicitly overwritten.
- **FR16:** The system must show clear processing, success, and failure states for generation and allow retry without forcing the user to re-enter the full brief.
- **FR17:** The system must log key product events and failures at minimum for intake started, extraction completed, pack generated, pack retried, and export/copy used.
- **FR18:** The system must store the source brief and generated pack at the deal/workspace level with a manual delete option so the user can control sensitive client material.
- **FR19:** The system must separate internal scoping notes from client-facing copy so the user can decide what is visible in the final proposal pack.

## 14. UX Requirements
- **Time to first value target:** Under 15 minutes from signup to first usable proposal pack; under 5 minutes from text paste to first draft once inside the app.
- **Required simplicity principles:** One narrow service flow, minimal setup, visible assumptions, progressive disclosure, no hidden AI reasoning, and no extra modules unrelated to scoping.
- **Loading/empty/failure state requirements:** The product must provide a useful empty state with an example brief, a visible processing state during extraction/generation, and clear failure messages with retry guidance.
- **Editing/approval requirements:** Users must be able to review extraction results before generation and edit any generated section before they send it externally.
- **Trust/safety requirements:** Inferred items must be visibly marked; exclusions must be explicit; risk flags must be explained in plain English; nothing sends automatically; source material must be deletable; no legal certainty should be implied.
- **Key screens or views required in v1:** Landing page + CTA, intake form, extraction/risk review screen, processing state, generated proposal pack view, saved pack list/history, and failure/retry state.

## 15. Success Metrics
- **North-star metric:** Qualified proposal packs generated for real website deals.
- **Activation metric:** 60% of qualified signups create a first usable proposal pack within 24 hours, while time to first value stays under 15 minutes.
- **Retention metric:** 50% of activated users run a second website brief within 30 days.
- **Revenue metric:** Convert 20% of qualified concierge or free-risk-check users into paid users and reach the first 3 paying workspaces in 30 days.
- **Quality metric:** 80% of generated packs are judged "usable with light edits" by the founder before client send, and generation succeeds without manual recovery in at least 90% of supported briefs.
- **Portfolio proof metric:** Collect at least 3 real examples showing 2+ hours saved or a specific scope gap caught before proposal send.

## 16. Monetization
- **Free offer / lead magnet:** Free Scope Risk Check on one real website brief.
- **Initial paid offer:** Founding concierge pack - send one website brief and receive a polished scoped proposal pack within 24 hours for $99.
- **Subscription or pricing hypothesis:** Self-serve ScopeOS launches at $39/month solo and $99/month team after the concierge offer proves repeat use.
- **Expansion pricing path:** Premium clause packs, niche add-ons (Webflow/WordPress/SEO migration), onboarding help, and higher-volume team plans.

## 17. Go-To-Market
- **Primary acquisition channel:** LinkedIn founder-led content targeting small web design agency owners; X is secondary.
- **Content angle:** Show how website agencies lose margin from vague page counts, content ambiguity, CMS migration assumptions, and unpriced revisions.
- **CTA:** Get a free Scope Risk Check or send one website brief.
- **Concierge validation path:** Manually process the first 10 website briefs, deliver packs within 24 hours, interview users after send, and use edits to refine the product.
- **Why inbound can work for this project:** The pain is specific, public, easy to demo with before/after examples, and tied directly to money lost on real deals.

## 18. Risks and Assumptions
### Main assumptions
- Small web design agencies will trust AI-generated first drafts if assumptions and exclusions are clearly labeled.
- Website proposal scoping is standardized enough to support a narrow reusable output pack.
- Buyers care more about faster, safer scoping than about prettier proposal presentation in the first purchase decision.

### Product risks
- Output quality may break on very messy transcripts or non-standard projects.
- Users may expect custom design/theming and polished document presentation before the core scoping value is proven.

### GTM risks
- Free content may attract prompt-seekers rather than agencies willing to pay for a workflow product.
- Agencies may hesitate to upload real client material unless privacy and manual review are clear.

### Technical risks
- Extracting accurate scope from low-quality or partial transcripts may create false confidence if not handled carefully.
- Supporting too many website variants too early (e-commerce, multilingual, custom app work) can dilute output quality and slow shipping.
- Handling real client briefs and transcripts creates trust and privacy expectations that must be addressed clearly even in an early MVP.

## 19. Validation Plan
### First 7 days
- Finalize the v1 website proposal pack structure and risk taxonomy.
- Build the landing page plus simple Scope Risk Checker intake flow.
- Run 3 concierge tests using real or realistic SMB website briefs and note every manual correction, failed inference, and missing validation rule.

### First 30 days
- Deliver at least 10 proposal packs for real or near-real website deals.
- Convert the first 3 paying users through the $99 concierge offer or early self-serve pilot.
- Measure time saved, repeated use, which risk flags or exclusions users keep vs edit, and where retries or failures occur in the flow.

### Evidence needed before scaling
- At least 50% of activated users return with a second website brief.
- At least 3 paying users say the value came from scope clarity or risk reduction, not only faster copy generation.
- The product can handle repeated brochure/marketing website briefs with consistent quality and at least 90% successful generation before expansion to adjacent niches.

## 20. Kill Criteria
- Fewer than 3 of the first 10 qualified agency conversations lead to a real brief submission.
- Activated users do not return with a second website brief within 30 days.
- Users say ChatGPT plus their existing template is good enough and refuse to pay for the workflow.

## 21. Future Roadmap
### Phase 2
- Add agency defaults for deposit terms, revision rounds, hourly change-order rates, and preferred proposal voice.
- Add reusable clause packs for common website scenarios such as CMS migration, copywriting, SEO, and training/support.
- Add deal memory so the agency can reuse past accepted scope structures and pricing anchors.

### Phase 3
- Add scope drift detection and change-order workflow after kickoff.
- Expand into adjacent agency niches like branding and performance marketing once website usage is proven.
- Add proposal analytics showing conversion, common edits, and most frequent scope risks.

## 22. Open Questions
- Should v1 stay strictly on brochure/marketing website projects, or include more complex website categories like e-commerce after the first 10 users?
- Should early monetization remain hybrid ($99 concierge + subscription), or switch to straight subscription once self-serve quality is proven?

## 23. Appendix
- **Relevant source files:**
  - `PROJECT_BRIEF.md`
  - `TASKS.md`
  - `CUSTOMERS.md`
  - `METRICS.md`
  - `LANDING_PAGE_COPY.md`
- **Extra notes:**
  - Exact v1 output pack structure:
    1. Deal summary and client goals
    2. Extracted website scope snapshot
    3. Missing info and risk flags
    4. Three pricing tiers
    5. Detailed SOW
    6. Assumptions and exclusions
    7. Timeline and dependencies
    8. Clarification questions to send the client
    9. Change-order starter language
  - First-value moment to design for: "I pasted one messy website discovery transcript and immediately got a proposal draft that caught missing scope before I priced it."
  - Definition of "usable with light edits": the founder can send or finalize the pack after copy cleanup and minor scope corrections, without rebuilding the proposal from scratch.
  - V1 operational guardrails to keep the product production-minded without adding enterprise complexity:
    - validate bad or incomplete inputs early
    - never auto-send client-facing output
    - preserve edits across retries where possible
    - log failures and usage events for product learning
    - keep client material deletable by the user

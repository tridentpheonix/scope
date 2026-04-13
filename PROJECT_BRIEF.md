# PROJECT BRIEF

## 1. Project Identity
- **Project Name:** ScopeOS
- **Folder Name:** `01-scopeos`
- **Status:** `building`
- **One-Line Pitch:** Turn messy client briefs, call notes, and transcripts into scoped proposals, SOWs, pricing options, and risk flags in minutes.
- **Portfolio Theme Fit:** AI operating system for service businesses; protects agency margins and showcases PM thinking around discovery, scope, pricing, and workflow design.

## 2. Problem
- **Target User:** small agency owners, freelancers, and account leads in web design, branding, marketing, and dev shops.
- **Buyer:** founder, sales lead, or delivery lead who writes proposals and signs clients.
- **Core Pain:** raw client briefs are incomplete, scope gets guessed, proposals take too long, and unclear deliverables cause unpaid revisions later.
- **Why this pain matters now:** budgets are tighter, competition is higher, and small agencies cannot afford to lose margin on bad scoping.
- **Current workaround:** Google Docs templates, manual note cleanup, ChatGPT prompting, Notion docs, and founder memory.
- **Why existing tools are not enough:** proposal tools focus on presentation and signatures, not scope decomposition, missing-info detection, or change-order readiness.

## 3. Value Proposition
- **Main promise:** convert client chaos into a safe, sellable, and handoff-ready commercial package.
- **Time saved / money saved / risk reduced hypothesis:** cut proposal prep from 2-6 hours to 20-30 minutes and catch major scope gaps before signing.
- **Why someone would pay:** one prevented scope-creep incident can pay for months of subscription.
- **Why this is better than ChatGPT + manual work:** structured workflow, reusable output format, built-in risk prompts, pricing logic, exclusions, and downstream change-order hooks.

## 4. Product Wedge
- **Initial wedge:** brief or transcript in, proposal pack out.
- **What this product does not do:** CRM, invoicing, contract e-sign, full project management, or enterprise approvals in v1.
- **Why this wedge is hard enough to matter but simple enough to ship:** it attacks one painful workflow with visible ROI and can be validated without heavy integrations.

## 5. User Evidence
- **Evidence already available:** agencies repeatedly report budget pressure, lead follow-up pressure, and over-servicing; founders already use AI but still do scoping manually.
- **Who can be the first 10 users:** freelance web designers, boutique branding studios, small dev agencies, and marketing agencies on LinkedIn/X.
- **How to get the first 3 real conversations:** post teardown content about bad briefs, offer a free Scope Risk Check, and invite agency owners to send one real brief.
- **Top assumptions that still need validation:** agencies will trust AI-generated exclusions; buyers care more about margin protection than prettier proposals; manual concierge output can convert to paid.

## 6. MVP
- **MVP goal:** a small agency can upload one real brief and get a usable proposal + SOW pack that saves time and reduces ambiguity.
- **Core user flow:**
  1. User pastes brief, call notes, Loom transcript, or meeting summary.
  2. App extracts goals, deliverables, assumptions, missing inputs, and risk flags.
  3. User chooses one service type and pricing style.
  4. App generates proposal, SOW, exclusions, timeline, and change-order starter.
- **V1 features only:**
  - brief/transcript intake
  - scope extraction and missing-info detection
  - proposal draft with 3 pricing tiers
  - SOW/exclusions/change-order draft
- **Non-goals for v1:**
  - CRM sync
  - e-signatures
  - full team collaboration

## 7. Monetization
- **Pricing hypothesis:** $39/month solo, $99/month team, with manual concierge upsell for premium onboarding.
- **Free offer / lead magnet:** free Scope Risk Checker on one brief.
- **Initial paid offer:** Send one brief and get a scoped proposal pack in 24 hours for a founding price.
- **Longer-term revenue model:** SaaS subscription plus premium templates, niche clause packs, and team plans.

## 8. Go-To-Market
- **Primary acquisition channel:** LinkedIn first, X second.
- **Content angle:** scope creep, proposal mistakes, underpricing, and what a brief is missing.
- **Primary CTA:** Comment `SCOPE` for a free Scope Risk Check.
- **Concierge offer if needed:** founder sends a real brief and receives a finished proposal pack manually.
- **Why users will come inbound instead of needing outbound pitching:** content is pain-first, highly demoable, and agency owners already discuss scoping pain publicly.

## 9. Metrics
- **North-star metric:** qualified proposal packs generated per active workspace.
- **Activation metric:** first usable proposal pack generated within 1 day of signup.
- **Retention signal:** repeat use on second or third brief within 30 days.
- **Revenue signal:** number of paying workspaces and proposal packs generated for live deals.
- **Portfolio proof metric:** measurable reduction in prep time plus evidence that users used output for real client proposals.

## 10. Build Strategy
- **Cheapest way to validate before full build:** manual concierge service with a simple intake form and templated outputs.
- **Tools/stack constraint:** use a low-cost web stack, file upload, prompt orchestration, and manual export if needed.
- **Current export decision:** keep copy + markdown export in v1 so agencies can move drafts into their existing proposal/doc workflow; defer branded export until paid users say send-time formatting is the blocker.
- **Manual ops allowed in phase 1:** yes; founder can review and edit outputs before delivery.
- **Main technical risk:** output quality across inconsistent briefs and service categories.
- **Main UX risk:** users may not trust scope suggestions unless they can see assumptions clearly.

## 11. Roadmap
### 7-day target
- build landing page and brief intake
- finalize output structure for proposal + SOW
- run 3 manual concierge tests

### 30-day target
- onboard first 5 active users
- add editable proposal sections and export
- collect first testimonial and first paid user

### 90-day expansion path
- add proposal memory from prior deals
- add scope drift detection and change-order workflow
- add niche packs for web, branding, and marketing agencies

## 12. PM Story
- **Discovery story:** scope creep, underpricing, and messy briefs emerged repeatedly in agency workflow research.
- **Prioritization story:** prioritized risk detection and handoff-ready output over proposal styling features.
- **Tradeoff story:** excluded CRM, signatures, and payments to focus on the highest-friction step.
- **Learning story:** pivot if agencies only want prettier proposal generation and do not value risk/exclusion logic.

## 13. Kill Criteria
- users like outputs but still prefer ChatGPT plus templates
- no one sends a second real brief
- no clear path to first 3 paying users after manual concierge tests

## 14. Notes
- Open questions:
  - Should v1 stay strictly on brochure/marketing website projects, or include more complex website categories like e-commerce after the first 10 users?
  - Should early monetization remain hybrid ($99 concierge + subscription), or switch to straight subscription once self-serve quality is proven?
- Useful links:
  - Root workflow: `C:/Users/satya/OneDrive/Desktop/ha ha ha ha/New idea/MASTER_OPERATING_CONVENTION.md`
  - Parent strategy context: `C:/Users/satya/OneDrive/Desktop/ha ha ha ha/New idea/PROJECT_CONTEXT.md`

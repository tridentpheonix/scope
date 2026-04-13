import { describe, expect, it } from "vitest";
import { getWorkspaceLaunchpadAction } from "./workspace-launchpad";

describe("getWorkspaceLaunchpadAction", () => {
  it("guides a brand-new workspace to the risk check", () => {
    expect(getWorkspaceLaunchpadAction([])).toEqual({
      href: "/risk-check",
      label: "Start a Scope Risk Check",
      description:
        "Paste a live website brief, transcript, or call summary to seed the workspace with a real deal.",
    });
  });

  it("continues an existing proposal pack", () => {
    expect(
      getWorkspaceLaunchpadAction([
        {
          submissionId: "deal-1",
          agencyName: "Northline Studio",
          projectTypeLabel: "Marketing website redesign",
          briefSourceLabel: "Meeting transcript",
          summaryPreview: "A sample deal",
          createdAt: "2026-04-13T10:00:00.000Z",
          lastTouchedAt: "2026-04-13T11:00:00.000Z",
          hasSavedReview: true,
          hasSavedProposalPack: true,
          currentStageLabel: "Proposal draft saved",
        },
      ]),
    ).toEqual({
      href: "/proposal-pack/deal-1",
      label: "Reopen latest proposal draft",
      description:
        "Continue the latest deal for Northline Studio from the saved proposal pack.",
    });
  });

  it("opens extraction review when only intake exists", () => {
    expect(
      getWorkspaceLaunchpadAction([
        {
          submissionId: "deal-2",
          agencyName: "Northline Studio",
          projectTypeLabel: "Marketing website redesign",
          briefSourceLabel: "Meeting transcript",
          summaryPreview: "A sample deal",
          createdAt: "2026-04-13T10:00:00.000Z",
          lastTouchedAt: "2026-04-13T11:00:00.000Z",
          hasSavedReview: false,
          hasSavedProposalPack: false,
          currentStageLabel: "Intake saved",
        },
      ]),
    ).toEqual({
      href: "/extraction-review/deal-2",
      label: "Open extraction review",
      description:
        "The intake for Northline Studio is saved and ready for internal scope review.",
    });
  });
});

import type { Route } from "next";
import type { SavedDealSummary } from "./saved-deals";

export type WorkspaceLaunchpadAction = {
  href: Route;
  label: string;
  description: string;
};

export function getWorkspaceLaunchpadAction(deals: SavedDealSummary[]): WorkspaceLaunchpadAction {
  const latestDeal = deals[0];

  if (!latestDeal) {
    return {
      href: "/risk-check",
      label: "Start a Scope Risk Check",
      description:
        "Paste a live website brief, transcript, or call summary to seed the workspace with a real deal.",
    };
  }

  if (latestDeal.hasSavedProposalPack) {
    return {
      href: `/proposal-pack/${latestDeal.submissionId}` as Route,
      label: "Reopen latest proposal draft",
      description: `Continue the latest deal for ${latestDeal.agencyName} from the saved proposal pack.`,
    };
  }

  if (latestDeal.hasSavedReview) {
    return {
      href: `/proposal-pack/${latestDeal.submissionId}` as Route,
      label: "Continue to proposal pack",
      description: `The extraction review for ${latestDeal.agencyName} is ready for client-facing drafting.`,
    };
  }

  return {
    href: `/extraction-review/${latestDeal.submissionId}` as Route,
    label: "Open extraction review",
    description: `The intake for ${latestDeal.agencyName} is saved and ready for internal scope review.`,
  };
}

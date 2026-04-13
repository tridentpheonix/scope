import { readExtractionReviewRecords } from "./extraction-review-storage";
import { readProposalPackRecords } from "./proposal-pack-storage";
import {
  getBriefSourceLabel,
  getProjectTypeLabel,
  getSummaryPreview,
} from "./risk-check-presenters";
import { readRiskCheckSubmissions } from "./risk-check-storage";

export type SavedDealSummary = {
  submissionId: string;
  agencyName: string;
  projectTypeLabel: string;
  briefSourceLabel: string;
  summaryPreview: string;
  createdAt: string;
  lastTouchedAt: string;
  hasSavedReview: boolean;
  hasSavedProposalPack: boolean;
  currentStageLabel: string;
};

function getCurrentStageLabel(
  hasSavedReview: boolean,
  hasSavedProposalPack: boolean,
) {
  if (hasSavedProposalPack) {
    return "Proposal draft saved";
  }

  if (hasSavedReview) {
    return "Internal review saved";
  }

  return "Intake saved";
}

export async function readSavedDealSummaries(baseDir?: string, workspaceId?: string) {
  const [submissions, extractionReviews, proposalPacks] = await Promise.all([
    readRiskCheckSubmissions(baseDir, workspaceId),
    readExtractionReviewRecords(baseDir, workspaceId),
    readProposalPackRecords(baseDir, workspaceId),
  ]);

  const extractionReviewMap = new Map(
    extractionReviews.map((record) => [record.submissionId, record]),
  );
  const proposalPackMap = new Map(
    proposalPacks.map((record) => [record.submissionId, record]),
  );

  return submissions
    .map((submission) => {
      const extractionReview = extractionReviewMap.get(submission.id) ?? null;
      const proposalPack = proposalPackMap.get(submission.id) ?? null;
      const timestamps = [
        submission.createdAt,
        extractionReview?.updatedAt,
        proposalPack?.updatedAt,
      ].filter((value): value is string => Boolean(value));
      const lastTouchedAt = timestamps.sort(
        (left, right) => Date.parse(right) - Date.parse(left),
      )[0];

      return {
        submissionId: submission.id,
        agencyName: submission.payload.agencyName,
        projectTypeLabel: getProjectTypeLabel(submission.payload.projectType),
        briefSourceLabel: getBriefSourceLabel(submission.payload.briefSource),
        summaryPreview: getSummaryPreview(submission.payload.summary),
        createdAt: submission.createdAt,
        lastTouchedAt,
        hasSavedReview: Boolean(extractionReview),
        hasSavedProposalPack: Boolean(proposalPack),
        currentStageLabel: getCurrentStageLabel(
          Boolean(extractionReview),
          Boolean(proposalPack),
        ),
      } satisfies SavedDealSummary;
    })
    .sort((left, right) => Date.parse(right.lastTouchedAt) - Date.parse(left.lastTouchedAt));
}

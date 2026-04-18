import { applySavedProposalPackClientBlocks, createProposalPackDraft } from "./proposal-pack";
import { readProposalPackRecords } from "./proposal-pack-storage";
import { readRiskCheckSubmissions } from "./risk-check-storage";

export type ProposalMemoryItem = {
  submissionId: string;
  title: string;
  updatedAt: string;
  blocks: {
    assumptions: string;
    exclusions: string;
    commercialTerms: string;
  };
};

export async function readProposalMemory(
  currentSubmissionId: string,
  limit = 3,
  baseDir?: string,
  workspaceId?: string,
) {
  const sourceLimit = Math.max(limit * 20, 25);
  const [submissions, proposalPacks] = await Promise.all([
    readRiskCheckSubmissions(baseDir, workspaceId, sourceLimit),
    readProposalPackRecords(baseDir, workspaceId, sourceLimit),
  ]);

  const submissionMap = new Map(
    submissions.map((submission) => [submission.id, submission]),
  );

  const memories = proposalPacks
    .filter((record) => record.submissionId !== currentSubmissionId)
    .map((record) => {
      const submission = submissionMap.get(record.submissionId);
      if (!submission) {
        return null;
      }

      const baseDraft = createProposalPackDraft(submission);
      const mergedDraft = applySavedProposalPackClientBlocks(
        baseDraft,
        record.clientBlocks,
      );

      const assumptions =
        mergedDraft.blocks.find((block) => block.id === "assumptions")?.body ?? "";
      const exclusions =
        mergedDraft.blocks.find((block) => block.id === "exclusions")?.body ?? "";
      const commercialTerms =
        mergedDraft.blocks.find((block) => block.id === "commercial-terms")?.body ??
        "";

      return {
        submissionId: record.submissionId,
        title: mergedDraft.title,
        updatedAt: record.updatedAt,
        blocks: {
          assumptions,
          exclusions,
          commercialTerms,
        },
      } satisfies ProposalMemoryItem;
    })
    .filter((item): item is ProposalMemoryItem => Boolean(item))
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, limit);

  return memories;
}

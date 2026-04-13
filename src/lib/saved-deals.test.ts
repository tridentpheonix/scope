import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import { saveExtractionReviewRecord } from "./extraction-review-storage";
import { saveProposalPackRecord } from "./proposal-pack-storage";
import { persistRiskCheckSubmission } from "./risk-check-storage";
import { readSavedDealSummaries } from "./saved-deals";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-saved-deals-"));
  tempDirs.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("readSavedDealSummaries", () => {
  it("builds deal summaries with intake, review, and proposal state", async () => {
    const baseDir = await createTempDataDir();
    const firstCase = conciergeTestCases[0];
    const secondCase = conciergeTestCases[1];

    const intakeOnly = await persistRiskCheckSubmission(
      {
        ...firstCase.form,
        consent: true,
      },
      null,
      analyzeRiskCheckSubmission({
        ...firstCase.form,
        consent: true,
      }),
      {
        baseDir,
        id: "deal-intake",
        createdAt: "2026-04-11T01:00:00.000Z",
      },
    );

    const fullySaved = await persistRiskCheckSubmission(
      {
        ...secondCase.form,
        consent: true,
      },
      null,
      analyzeRiskCheckSubmission({
        ...secondCase.form,
        consent: true,
      }),
      {
        baseDir,
        id: "deal-proposal",
        createdAt: "2026-04-11T01:05:00.000Z",
      },
    );

    await saveExtractionReviewRecord(
      fullySaved.id,
      {
        summary: "Tighten scope around migration and stakeholder approvals.",
        pricingApproach: "Keep the middle tier as the default recommendation.",
        missingInfoQuestions: ["Who signs off on final sitemap changes?"],
        riskFlags: ["Migration depth is still unclear."],
        assumptions: ["Client provides final copy before build starts."],
      },
      { baseDir, updatedAt: "2026-04-11T01:10:00.000Z" },
    );

    await saveProposalPackRecord(
      fullySaved.id,
      {
        assumptions: "- Client provides final copy before build starts.",
      },
      { baseDir, updatedAt: "2026-04-11T01:20:00.000Z" },
    );

    const summaries = await readSavedDealSummaries(baseDir);

    expect(summaries).toHaveLength(2);
    expect(summaries[0].submissionId).toBe("deal-proposal");
    expect(summaries[0].hasSavedReview).toBe(true);
    expect(summaries[0].hasSavedProposalPack).toBe(true);
    expect(summaries[0].currentStageLabel).toBe("Proposal draft saved");
    expect(summaries[1].submissionId).toBe(intakeOnly.id);
    expect(summaries[1].currentStageLabel).toBe("Intake saved");
  });
});

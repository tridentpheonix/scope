import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import { saveChangeOrderRecord } from "./change-order-storage";
import { deleteClientMaterial } from "./deal-deletion";
import { saveExtractionReviewRecord } from "./extraction-review-storage";
import { saveProposalPackRecord } from "./proposal-pack-storage";
import { persistRiskCheckSubmission, readRiskCheckSubmissions } from "./risk-check-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-deal-delete-"));
  tempDirs.push(directory);
  return directory;
}

async function createAttachment(fileName: string) {
  const absolutePath = path.join(process.cwd(), "concierge-tests", "fixtures", fileName);
  const contents = await fs.readFile(absolutePath, "utf8");
  return new File([contents], fileName, { type: "text/plain" });
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("deal deletion", () => {
  it("removes submission records and related workspace files", async () => {
    const baseDir = await createTempDataDir();
    const testCase = conciergeTestCases[0];

    const submission = await persistRiskCheckSubmission(
      {
        ...testCase.form,
        consent: true,
      },
      await createAttachment(testCase.attachmentFileName ?? "01-industrial-b2b-marketing-redesign.txt"),
      analyzeRiskCheckSubmission({
        ...testCase.form,
        consent: true,
      }),
      {
        baseDir,
        id: "deal-delete-1",
        createdAt: "2026-04-12T02:00:00.000Z",
      },
    );

    await saveProposalPackRecord(
      submission.id,
      {
        assumptions: "- Client supplies final copy.",
      },
      { baseDir },
    );

    await saveExtractionReviewRecord(
      submission.id,
      {
        summary: "Tighten around migration.",
        pricingApproach: "Keep middle tier default.",
        missingInfoQuestions: ["Who owns copy?"],
        riskFlags: ["Migration scope vague."],
        assumptions: ["Client supplies final copy."],
      },
      { baseDir },
    );

    await saveChangeOrderRecord(
      submission.id,
      {
        driftItems: ["Extra landing page"],
        impactNotes: "Adds scope.",
      },
      { baseDir },
    );

    await fs.appendFile(
      path.join(baseDir, "events.ndjson"),
      `${JSON.stringify({ name: "proposal_pack_opened", submissionId: submission.id, createdAt: new Date().toISOString() })}\n`,
      "utf8",
    );

    const result = await deleteClientMaterial(submission.id, baseDir);

    expect(result.ok).toBe(true);
    const remainingSubmissions = await readRiskCheckSubmissions(baseDir);
    expect(remainingSubmissions).toHaveLength(0);
    await expect(
      fs.stat(path.join(baseDir, "proposal-packs", `${submission.id}.json`)),
    ).rejects.toThrow();
  });
});

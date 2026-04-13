import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { analyzeRiskCheckSubmission } from "./risk-check-analysis";
import { saveProposalPackRecord } from "./proposal-pack-storage";
import { persistRiskCheckSubmission } from "./risk-check-storage";
import { readProposalMemory } from "./proposal-memory";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-proposal-memory-"));
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

describe("readProposalMemory", () => {
  it("builds proposal memory from saved proposal packs", async () => {
    const baseDir = await createTempDataDir();
    const testCase = conciergeTestCases[0];

    const submission = await persistRiskCheckSubmission(
      {
        ...testCase.form,
        consent: true,
      },
      null,
      analyzeRiskCheckSubmission({
        ...testCase.form,
        consent: true,
      }),
      {
        baseDir,
        id: "memory-1",
        createdAt: "2026-04-12T00:10:00.000Z",
      },
    );

    await saveProposalPackRecord(
      submission.id,
      {
        assumptions: "- Client supplies final copy.",
        exclusions: "- SEO migration not included.",
        "commercial-terms": "- 50% deposit due at kickoff.",
      },
      { baseDir, updatedAt: "2026-04-12T00:15:00.000Z" },
    );

    const memory = await readProposalMemory("current", 3, baseDir);

    expect(memory).toHaveLength(1);
    expect(memory[0].blocks.assumptions).toContain("Client supplies final copy");
    expect(memory[0].blocks.exclusions).toContain("SEO migration");
    expect(memory[0].blocks.commercialTerms).toContain("deposit");
  });
});

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readExtractionReviewRecord,
  readExtractionReviewRecords,
  saveExtractionReviewRecord,
} from "./extraction-review-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "scopeos-extraction-review-"),
  );
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

describe("extraction review storage", () => {
  it("saves and reloads normalized extraction review drafts", async () => {
    const baseDir = await createTempDataDir();

    await saveExtractionReviewRecord(
      "review-1",
      {
        summary: "  Tighten around migration and content readiness.  ",
        pricingApproach: "  Keep the middle tier narrow.  ",
        missingInfoQuestions: [
          "Who owns the final copy?",
          "Who owns the final copy?",
        ],
        riskFlags: ["Migration scope is vague.", "Migration scope is vague."],
        assumptions: ["Client supplies final copy."],
      },
      { baseDir, updatedAt: "2026-04-11T01:40:00.000Z" },
    );

    const record = await readExtractionReviewRecord("review-1", baseDir);
    const records = await readExtractionReviewRecords(baseDir);

    expect(record?.review.summary).toBe("Tighten around migration and content readiness.");
    expect(record?.review.missingInfoQuestions).toEqual(["Who owns the final copy?"]);
    expect(record?.updatedAt).toBe("2026-04-11T01:40:00.000Z");
    expect(records).toHaveLength(1);
  });
});

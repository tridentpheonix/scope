import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { conciergeTestCases } from "../../concierge-tests/cases";
import { submitRiskCheck } from "./risk-check-service";
import { readRiskCheckSubmissions } from "./risk-check-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-risk-check-"));
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

describe("submitRiskCheck", () => {
  it("accepts three realistic concierge website redesign briefs", async () => {
    const baseDir = await createTempDataDir();
    const submissionIds = new Set<string>();

    for (const testCase of conciergeTestCases) {
      const formData = new FormData();
      formData.append("name", testCase.form.name);
      formData.append("email", testCase.form.email);
      formData.append("agencyName", testCase.form.agencyName);
      formData.append("websiteUrl", testCase.form.websiteUrl);
      formData.append("projectType", testCase.form.projectType);
      formData.append("briefSource", testCase.form.briefSource);
      formData.append("summary", testCase.form.summary);
      formData.append("consent", testCase.form.consent);

      if (testCase.attachmentFileName) {
        formData.append(
          "attachment",
          await createAttachment(testCase.attachmentFileName),
        );
      }

      const result = await submitRiskCheck(formData, { baseDir });

      expect(result.ok, testCase.title).toBe(true);
      if (!result.ok) {
        continue;
      }

      submissionIds.add(result.submission.id);
      expect(result.submission.payload.agencyName).toBe(testCase.form.agencyName);
      expect(result.submission.payload.projectType).toBe(testCase.form.projectType);
      expect(result.submission.analysis.missingInfoPrompts.length).toBeGreaterThan(0);
      expect(result.preview.topQuestions.length).toBeGreaterThan(0);
      expect(Boolean(result.submission.attachment)).toBe(
        Boolean(testCase.attachmentFileName),
      );
    }

    await fs.appendFile(
      path.join(baseDir, "risk-check-submissions.ndjson"),
      "not-json\n",
      "utf8",
    );

    const savedSubmissions = await readRiskCheckSubmissions(baseDir);

    expect(savedSubmissions).toHaveLength(conciergeTestCases.length);
    expect(submissionIds.size).toBe(conciergeTestCases.length);
    expect(savedSubmissions.map((submission) => submission.payload.projectType)).toEqual(
      conciergeTestCases.map((testCase) => testCase.form.projectType).reverse(),
    );
  });
});

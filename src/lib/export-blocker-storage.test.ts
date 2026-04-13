import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readExportBlockerSignals,
  saveExportBlockerSignal,
} from "./export-blocker-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-export-blocker-"));
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

describe("export blocker storage", () => {
  it("saves and reads export blocker signals", async () => {
    const baseDir = await createTempDataDir();

    await saveExportBlockerSignal(
      "Paid user said branded PDF is required before sending.",
      "deal-1",
      baseDir,
      {
        outcome: "needs-google-docs",
        themePreference: "both",
        nextStep: "Explore Google Docs integration.",
      },
    );

    const signals = await readExportBlockerSignals(baseDir);

    expect(signals).toHaveLength(1);
    expect(signals[0].submissionId).toBe("deal-1");
    expect(signals[0].note).toContain("branded PDF");
    expect(signals[0].outcome).toBe("needs-google-docs");
    expect(signals[0].themePreference).toBe("both");
  });
});

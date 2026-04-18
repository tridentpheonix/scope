import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readPilotFeedbackEntries, savePilotFeedbackEntry } from "./pilot-feedback-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-feedback-"));
  tempDirs.push(directory);
  return directory;
}

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.resetModules();
  await Promise.all(
    tempDirs.splice(0).map((directory) => fs.rm(directory, { recursive: true, force: true })),
  );
});

describe("pilot feedback storage", () => {
  it("saves and reads pilot feedback entries in recent-first order", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const baseDir = await createTempDataDir();

    await savePilotFeedbackEntry(
      {
        userId: "user-1",
        severity: "high",
        bucket: "support",
        whereHappened: "Launchpad",
        triedToDo: "Open the most recent deal",
        expectedResult: "The latest deal should open",
        actualResult: "The page stayed on the list",
        reproducibility: "sometimes",
        note: "Pilot user could not reopen the latest deal from the home card.",
      },
      { baseDir, workspaceId: "workspace-1" },
    );

    await savePilotFeedbackEntry(
      {
        userId: "user-1",
        severity: "blocker",
        bucket: "deals",
        whereHappened: "/deals",
        triedToDo: "Download client materials",
        expectedResult: "The file should download",
        actualResult: "The route returned a 404",
        reproducibility: "always",
        note: "Download route missing on one seeded workspace.",
      },
      { baseDir, workspaceId: "workspace-1" },
    );

    await fs.appendFile(path.join(baseDir, "pilot-feedback.ndjson"), "not-json\n", "utf8");

    const entries = await readPilotFeedbackEntries(baseDir, "workspace-1", 5);

    expect(entries).toHaveLength(2);
    expect(entries[0].severity).toBe("blocker");
    expect(entries[0].bucket).toBe("deals");
    expect(entries[1].severity).toBe("high");
    expect(entries[1].bucket).toBe("support");
  });
});

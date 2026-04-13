import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readChangeOrderRecord,
  saveChangeOrderRecord,
} from "./change-order-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-change-order-"));
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

describe("change order storage", () => {
  it("saves and reloads change-order drafts", async () => {
    const baseDir = await createTempDataDir();

    await saveChangeOrderRecord(
      "deal-1",
      {
        driftItems: ["Extra landing page", "Custom CRM integration"],
        impactNotes: "Requires additional build time and QA.",
      },
      { baseDir, updatedAt: "2026-04-12T00:00:00.000Z" },
    );

    const record = await readChangeOrderRecord("deal-1", baseDir);

    expect(record?.submissionId).toBe("deal-1");
    expect(record?.draft.driftItems).toHaveLength(2);
    expect(record?.draft.impactNotes).toContain("additional build time");
  });
});

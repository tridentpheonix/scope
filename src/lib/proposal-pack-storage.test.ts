import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readProposalPackRecord,
  saveProposalPackRecord,
} from "./proposal-pack-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-proposal-pack-"));
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

describe("proposal pack storage", () => {
  it("saves and reloads client-facing proposal blocks", async () => {
    const baseDir = await createTempDataDir();

    await saveProposalPackRecord(
      "pack-1",
      {
        assumptions: "- Client supplies approved copy",
        "pricing-tier-1": "Lean scope tier body",
      },
      { baseDir, updatedAt: "2026-04-11T00:00:00.000Z" },
    );

    const record = await readProposalPackRecord("pack-1", baseDir);

    expect(record?.submissionId).toBe("pack-1");
    expect(record?.clientBlocks.assumptions).toContain("approved copy");
    expect(record?.updatedAt).toBe("2026-04-11T00:00:00.000Z");
  });
});

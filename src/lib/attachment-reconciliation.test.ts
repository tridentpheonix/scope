import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runAttachmentReconciliation } from "./attachment-reconciliation";
import { saveAttachment } from "./attachment-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-reconcile-"));
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

describe("attachment reconciliation", () => {
  it("removes orphaned filesystem attachments and keeps referenced ones", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    vi.stubEnv("OBSERVABILITY_WEBHOOK_URL", "");

    const baseDir = await createTempDataDir();
    const uploadsDir = path.join(baseDir, "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const attachment = await saveAttachment(
      "submission-1",
      new File(["client brief"], "client brief.txt", { type: "text/plain" }),
      baseDir,
    );

    expect(attachment).not.toBeNull();

    const submissionFile = path.join(baseDir, "risk-check-submissions.ndjson");
    await fs.writeFile(
      submissionFile,
      `${JSON.stringify({
        id: "submission-1",
        createdAt: "2026-04-18T00:00:00.000Z",
        payload: { companyName: "Acme", audience: "B2B" },
        attachment,
        analysis: {},
      })}\n`,
      "utf8",
    );

    const orphanPath = path.join(uploadsDir, "orphan.txt");
    await fs.writeFile(orphanPath, "orphan", "utf8");

    const summary = await runAttachmentReconciliation({
      baseDir,
      dryRun: false,
    });

    expect(summary).toMatchObject({
      dryRun: false,
      referencedCount: 1,
      filesystemCandidates: 2,
      filesystemOrphans: 1,
      deletedCount: 1,
    });

    await expect(fs.stat(orphanPath)).rejects.toThrow();
    await expect(fs.stat(path.join(baseDir, attachment!.relativePath!))).resolves.toBeDefined();
  });
});

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-attachments-"));
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

describe("attachment storage", () => {
  it("stores and deletes filesystem attachments when blob storage is unavailable", async () => {
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");
    const {
      createAttachmentDownloadResponse,
      deleteAttachment,
      saveAttachment,
    } = await import("./attachment-storage");

    const baseDir = await createTempDataDir();
    const file = new File(["hello world"], "client brief.txt", { type: "text/plain" });

    const attachment = await saveAttachment("submission-1", file, baseDir);

    expect(attachment).not.toBeNull();
    expect(attachment?.storageKind).toBe("filesystem");
    expect(attachment?.relativePath).toContain("uploads");

    const absolutePath = path.join(baseDir, attachment!.relativePath!);
    await expect(fs.readFile(absolutePath, "utf8")).resolves.toBe("hello world");

    const response = await createAttachmentDownloadResponse(attachment, null, baseDir);
    expect(response).not.toBeNull();
    expect(response?.headers.get("content-type")).toBe("text/plain");
    expect(response?.headers.get("content-disposition")).toContain("client brief.txt");
    expect(await response?.text()).toBe("hello world");

    await deleteAttachment(attachment, baseDir);
    await expect(fs.stat(absolutePath)).rejects.toThrow();
  });
});

import { del, list } from "@vercel/blob";
import { promises as fs } from "node:fs";
import path from "node:path";
import { appEnv, isBlobStorageConfigured } from "./env";
import { normalizeSavedAttachment, type SavedAttachment } from "./attachment-storage";
import { recordDiagnostic } from "./diagnostics";
import { readRiskCheckSubmissions } from "./risk-check-storage";

const defaultDataDir = path.join(process.cwd(), "data");

type AttachmentRef = {
  kind: "blob" | "filesystem";
  ref: string;
  storedName: string;
};

export type AttachmentReconciliationSummary = {
  dryRun: boolean;
  referencedCount: number;
  blobCandidates: number;
  blobOrphans: number;
  filesystemCandidates: number;
  filesystemOrphans: number;
  deletedCount: number;
};

export type AttachmentReconciliationOptions = {
  baseDir?: string;
  workspaceId?: string;
  dryRun?: boolean;
  blobPrefix?: string;
};

function collectAttachmentRefs(attachments: Array<SavedAttachment | null>) {
  const refs: AttachmentRef[] = [];

  for (const attachment of attachments) {
    if (!attachment) {
      continue;
    }

    if (attachment.storageKind === "blob") {
      refs.push({
        kind: "blob",
        ref: attachment.storageRef,
        storedName: attachment.storedName,
      });
      continue;
    }

    if (attachment.storageKind === "filesystem") {
      refs.push({
        kind: "filesystem",
        ref: path.basename(attachment.relativePath ?? attachment.storageRef),
        storedName: attachment.storedName,
      });
    }
  }

  return refs;
}

async function readAllReferencedAttachments(baseDir: string, workspaceId?: string) {
  const submissions = await readRiskCheckSubmissions(baseDir, workspaceId);
  return collectAttachmentRefs(submissions.map((submission) => normalizeSavedAttachment(submission.attachment)));
}

async function reconcileBlobAttachments(
  referencedBlobRefs: Set<string>,
  dryRun: boolean,
  blobPrefix = "attachments/",
) {
  if (!isBlobStorageConfigured()) {
    return { candidates: 0, orphans: 0, deleted: 0 };
  }

  let cursor: string | undefined;
  let candidates = 0;
  let orphans = 0;
  let deleted = 0;

  do {
    const result = await list({
      prefix: blobPrefix,
      cursor,
      limit: 1000,
      token: appEnv.blobReadWriteToken ?? undefined,
    });

    candidates += result.blobs.length;

    for (const blob of result.blobs) {
      if (referencedBlobRefs.has(blob.pathname)) {
        continue;
      }

      orphans += 1;
      if (!dryRun) {
        await del(blob.pathname, {
          token: appEnv.blobReadWriteToken ?? undefined,
        });
        deleted += 1;
      }
    }

    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return { candidates, orphans, deleted };
}

async function reconcileFilesystemAttachments(
  baseDir: string,
  referencedFileNames: Set<string>,
  dryRun: boolean,
) {
  const uploadDir = path.join(baseDir, "uploads");

  try {
    const entries = await fs.readdir(uploadDir, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile());
    let orphans = 0;
    let deleted = 0;

    for (const file of files) {
      if (referencedFileNames.has(file.name)) {
        continue;
      }

      orphans += 1;
      if (!dryRun) {
        await fs.rm(path.join(uploadDir, file.name), { force: true });
        deleted += 1;
      }
    }

    return {
      candidates: files.length,
      orphans,
      deleted,
    };
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return { candidates: 0, orphans: 0, deleted: 0 };
    }

    throw error;
  }
}

export async function runAttachmentReconciliation(options: AttachmentReconciliationOptions = {}) {
  const baseDir = options.baseDir ?? defaultDataDir;
  const dryRun = options.dryRun ?? true;
  const blobPrefix = options.blobPrefix ?? "attachments/";

  void recordDiagnostic("info", "maintenance", "attachment_reconciliation_started", {
    route: "/scripts/reconcile-orphan-attachments",
    workspaceId: options.workspaceId,
    message: dryRun ? "Attachment reconciliation dry run started." : "Attachment reconciliation started.",
    details: {
      dryRun,
      blobPrefix,
    },
    baseDir,
  });

  try {
    const referencedAttachments = await readAllReferencedAttachments(baseDir, options.workspaceId);
    const referencedBlobRefs = new Set(
      referencedAttachments.filter((item) => item.kind === "blob").map((item) => item.ref),
    );
    const referencedFileNames = new Set(
      referencedAttachments.filter((item) => item.kind === "filesystem").map((item) => item.ref),
    );

    const [blobSummary, filesystemSummary] = await Promise.all([
      reconcileBlobAttachments(referencedBlobRefs, dryRun, blobPrefix),
      reconcileFilesystemAttachments(baseDir, referencedFileNames, dryRun),
    ]);

    const summary: AttachmentReconciliationSummary = {
      dryRun,
      referencedCount: referencedAttachments.length,
      blobCandidates: blobSummary.candidates,
      blobOrphans: blobSummary.orphans,
      filesystemCandidates: filesystemSummary.candidates,
      filesystemOrphans: filesystemSummary.orphans,
      deletedCount: blobSummary.deleted + filesystemSummary.deleted,
    };

    void recordDiagnostic("info", "maintenance", "attachment_reconciliation_finished", {
      route: "/scripts/reconcile-orphan-attachments",
      workspaceId: options.workspaceId,
      message: dryRun ? "Attachment reconciliation dry run completed." : "Attachment reconciliation completed.",
      details: summary,
      baseDir,
    });

    return summary;
  } catch (error) {
    void recordDiagnostic("error", "maintenance", "attachment_reconciliation_failed", {
      route: "/scripts/reconcile-orphan-attachments",
      workspaceId: options.workspaceId,
      message: dryRun ? "Attachment reconciliation dry run failed." : "Attachment reconciliation failed.",
      details: {
        dryRun,
        blobPrefix,
      },
      error,
      baseDir,
    });

    throw error;
  }
}

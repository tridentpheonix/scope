import { promises as fs } from "node:fs";
import path from "node:path";
import { isMongoConfigured } from "./env";
import { deleteAttachment, normalizeSavedAttachment } from "./attachment-storage";
import { tryParseJson } from "./json-safe";
import { readRiskCheckSubmissions } from "./risk-check-storage";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseMongo(baseDir?: string) {
  return isMongoConfigured() && (!baseDir || baseDir === defaultDataDir);
}

type RiskCheckSubmissionDocument = {
  _id: string;
  workspaceId: string;
  attachment: unknown;
  attachmentContentBase64?: string | null;
};

type SubmissionLinkedDocument = {
  _id: string;
  workspaceId: string;
  submissionId?: string;
};

type DeletionResult = {
  ok: boolean;
  message: string;
};

async function removeFile(filePath: string) {
  try {
    await fs.rm(filePath, { force: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }
}

async function rewriteNdjson(
  filePath: string,
  shouldKeep: (line: string) => boolean,
) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const filtered = content
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => {
        const parsed = tryParseJson<unknown>(line);
        if (!parsed) {
          return true;
        }

        return shouldKeep(line);
      });

    if (filtered.length === 0) {
      await removeFile(filePath);
      return;
    }

    await fs.writeFile(filePath, `${filtered.join("\n")}\n`, "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }
}

export async function deleteClientMaterial(
  submissionId: string,
  baseDir = defaultDataDir,
  workspaceId?: string,
): Promise<DeletionResult> {
  if (shouldUseMongo(baseDir)) {
    if (!workspaceId) {
      return {
        ok: false,
        message: "Workspace is required.",
      };
    }

    await ensureMongoIndexes();
    const submissions = await getMongoCollection<RiskCheckSubmissionDocument>("risk_check_submissions");
    const analyticsEvents = await getMongoCollection<SubmissionLinkedDocument>("analytics_events");
    const exportFeedback = await getMongoCollection<SubmissionLinkedDocument>("export_feedback");
    const pilotFeedback = await getMongoCollection<SubmissionLinkedDocument>("pilot_feedback");
    const proposalPacks = await getMongoCollection<SubmissionLinkedDocument>("proposal_packs");
    const extractionReviews = await getMongoCollection<SubmissionLinkedDocument>("extraction_reviews");
    const changeOrders = await getMongoCollection<SubmissionLinkedDocument>("change_orders");

    const submission = await submissions.findOne({ _id: submissionId, workspaceId });
    if (!submission) {
      return {
        ok: false,
        message: "Submission not found.",
      };
    }

    await submissions.deleteOne({ _id: submissionId, workspaceId });
    await analyticsEvents.deleteMany({ workspaceId, submissionId });
    await exportFeedback.deleteMany({ workspaceId, submissionId });
    await pilotFeedback.deleteMany({ workspaceId, submissionId });
    await proposalPacks.deleteOne({ _id: submissionId, workspaceId });
    await extractionReviews.deleteOne({ _id: submissionId, workspaceId });
    await changeOrders.deleteOne({ _id: submissionId, workspaceId });

    await deleteAttachment(
      normalizeSavedAttachment(submission.attachment) ??
        (submission.attachmentContentBase64
          ? {
              originalName: "legacy-upload",
              storedName: `${submissionId}-legacy-upload`,
              mimeType: "application/octet-stream",
              size: 0,
              storageKind: "legacy-db",
              storageRef: "stored-in-database",
            }
          : null),
    );

    return {
      ok: true,
      message: "Client materials deleted for this deal.",
    };
  }

  const submissions = await readRiskCheckSubmissions(baseDir, workspaceId);
  const submission = submissions.find((item) => item.id === submissionId);

  if (!submission) {
    return {
      ok: false,
      message: "Submission not found.",
    };
  }

  await deleteAttachment(normalizeSavedAttachment(submission.attachment), baseDir);

  await rewriteNdjson(
    path.join(baseDir, "risk-check-submissions.ndjson"),
    (line) => {
      const parsed = tryParseJson<{ id?: string }>(line);
      return parsed?.id !== submissionId;
    },
  );

  await rewriteNdjson(path.join(baseDir, "events.ndjson"), (line) => {
    const parsed = tryParseJson<{ submissionId?: string }>(line);
    return parsed?.submissionId !== submissionId;
  });

  await rewriteNdjson(path.join(baseDir, "export-blockers.ndjson"), (line) => {
    const parsed = tryParseJson<{ submissionId?: string }>(line);
    return parsed?.submissionId !== submissionId;
  });

  await rewriteNdjson(path.join(baseDir, "pilot-feedback.ndjson"), (line) => {
    const parsed = tryParseJson<{ submissionId?: string }>(line);
    return parsed?.submissionId !== submissionId;
  });

  await removeFile(path.join(baseDir, "proposal-packs", `${submissionId}.json`));
  await removeFile(path.join(baseDir, "extraction-reviews", `${submissionId}.json`));
  await removeFile(path.join(baseDir, "change-orders", `${submissionId}.json`));

  return {
    ok: true,
    message: "Client materials deleted for this deal.",
  };
}

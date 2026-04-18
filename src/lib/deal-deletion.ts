import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery } from "./db";
import { isNeonConfigured } from "./env";
import { deleteAttachment, normalizeSavedAttachment } from "./attachment-storage";
import { tryParseJson } from "./json-safe";
import { readRiskCheckSubmissions } from "./risk-check-storage";

const defaultDataDir = path.join(process.cwd(), "data");

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

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
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return {
        ok: false,
        message: "Workspace is required.",
      };
    }

    const matches = await dbQuery<{
      id: string;
      attachment: unknown;
      attachment_content_base64: string | null;
    }>(
      `
        SELECT id, attachment, attachment_content_base64
        FROM app_risk_check_submissions
        WHERE id = $1 AND workspace_id = $2
        LIMIT 1
      `,
      [submissionId, workspaceId],
    );

    const submission = matches[0];
    if (!submission) {
      return {
        ok: false,
        message: "Submission not found.",
      };
    }

    await dbQuery(
      `
        DELETE FROM app_risk_check_submissions
        WHERE id = $1 AND workspace_id = $2
      `,
      [submissionId, workspaceId],
    );

    await dbQuery(
      `
        DELETE FROM app_analytics_events
        WHERE workspace_id = $1 AND submission_id = $2
      `,
      [workspaceId, submissionId],
    );

    await dbQuery(
      `
        DELETE FROM app_export_feedback
        WHERE workspace_id = $1 AND submission_id = $2
      `,
      [workspaceId, submissionId],
    );

    await dbQuery(
      `
        DELETE FROM app_pilot_feedback
        WHERE workspace_id = $1 AND submission_id = $2
      `,
      [workspaceId, submissionId],
    );

    await deleteAttachment(
      normalizeSavedAttachment(submission.attachment) ??
        (submission.attachment_content_base64
          ? {
              originalName: "legacy-upload",
              storedName: `${submissionId}-legacy-upload`,
              mimeType: "application/octet-stream",
              size: 0,
              storageKind: "legacy-db",
              storageRef: "stored-in-neon",
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

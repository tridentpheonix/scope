import { promises as fs } from "node:fs";
import path from "node:path";
import { dbQuery } from "./db";
import { isNeonConfigured } from "./env";
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
      .filter(shouldKeep);

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

    const matches = await dbQuery<{ id: string }>(
      `
        SELECT id
        FROM app_risk_check_submissions
        WHERE id = $1 AND workspace_id = $2
        LIMIT 1
      `,
      [submissionId, workspaceId],
    );

    if (!matches[0]) {
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

  if (submission.attachment?.relativePath) {
    const attachmentPath = path.join(baseDir, submission.attachment.relativePath);
    await removeFile(attachmentPath);
  }

  await rewriteNdjson(
    path.join(baseDir, "risk-check-submissions.ndjson"),
    (line) => JSON.parse(line).id !== submissionId,
  );

  await rewriteNdjson(path.join(baseDir, "events.ndjson"), (line) => {
    const parsed = JSON.parse(line) as { submissionId?: string };
    return parsed.submissionId !== submissionId;
  });

  await removeFile(path.join(baseDir, "proposal-packs", `${submissionId}.json`));
  await removeFile(path.join(baseDir, "extraction-reviews", `${submissionId}.json`));
  await removeFile(path.join(baseDir, "change-orders", `${submissionId}.json`));

  return {
    ok: true,
    message: "Client materials deleted for this deal.",
  };
}

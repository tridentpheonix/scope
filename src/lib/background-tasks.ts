import path from "node:path";
import type { Collection } from "mongodb";
import { deleteAttachment, normalizeSavedAttachment, type SavedAttachment } from "./attachment-storage";
import { recordDiagnostic } from "./diagnostics";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

const defaultDataDir = path.join(process.cwd(), "data");

export type BackgroundTaskType = "attachment_cleanup";
export type BackgroundTaskStatus = "pending" | "processing" | "succeeded" | "failed";

export type BackgroundTaskError = {
  name: string;
  message: string;
  stack?: string;
};

export type BackgroundTaskRecord = {
  id: string;
  type: BackgroundTaskType;
  status: BackgroundTaskStatus;
  dedupeKey: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  runAfter: string;
  lockedAt: string | null;
  leaseExpiresAt: string | null;
  completedAt: string | null;
  lastError: BackgroundTaskError | null;
  expiresAt: string | null;
  payload: {
    workspaceId?: string;
    submissionId?: string;
    attachment?: SavedAttachment | null;
    baseDir?: string;
  };
};

type BackgroundTaskDocument = Omit<BackgroundTaskRecord, "id" | "expiresAt"> & {
  _id: string;
  expiresAt: Date | null;
};

type BackgroundTaskClaim = BackgroundTaskDocument;

type BackgroundTaskCollection = Collection<BackgroundTaskDocument>;

function unwrapFindOneAndUpdateResult(taskResult: unknown): BackgroundTaskClaim | null {
  if (!taskResult) {
    return null;
  }

  if (typeof taskResult === "object" && taskResult && "value" in taskResult) {
    return (taskResult as { value?: BackgroundTaskClaim | null }).value ?? null;
  }

  return taskResult as BackgroundTaskClaim;
}

function normalizeTaskError(error: unknown): BackgroundTaskError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "string") {
    return {
      name: "Error",
      message: error,
    };
  }

  try {
    return {
      name: "Error",
      message: JSON.stringify(error),
    };
  } catch {
    return {
      name: "Error",
      message: "Unknown error",
    };
  }
}

function getTaskExpiry(now: Date) {
  return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
}

function getTaskLeaseExpiry(now: Date) {
  return new Date(now.getTime() + 10 * 60 * 1000);
}

function getRetryRunAfter(now: Date, attemptNumber: number) {
  const delayMinutes = Math.min(5 * attemptNumber, 60);
  return new Date(now.getTime() + delayMinutes * 60 * 1000);
}

async function getBackgroundTasksCollection(): Promise<BackgroundTaskCollection> {
  await ensureMongoIndexes();
  return getMongoCollection<BackgroundTaskDocument>("background_tasks");
}

export async function queueAttachmentCleanupTask(input: {
  workspaceId?: string;
  submissionId?: string;
  attachment: SavedAttachment | null | undefined;
  baseDir?: string;
}) {
  const attachment = normalizeSavedAttachment(input.attachment);
  if (!attachment || attachment.storageKind === "legacy-db") {
    return { queued: false as const };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const collection = await getBackgroundTasksCollection();
  const dedupeKey = `attachment_cleanup:${input.workspaceId ?? "workspace"}:${input.submissionId ?? attachment.storedName}`;

  try {
    const existing = await collection.findOne({ dedupeKey });
    if (existing) {
      return { queued: true as const, deduped: true as const };
    }

    await collection.insertOne({
      _id: crypto.randomUUID(),
      type: "attachment_cleanup",
      status: "pending",
      dedupeKey,
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      runAfter: nowIso,
      lockedAt: null,
      leaseExpiresAt: null,
      completedAt: null,
      lastError: null,
      expiresAt: null,
      payload: {
        workspaceId: input.workspaceId,
        submissionId: input.submissionId,
        attachment,
        baseDir: input.baseDir,
      },
    });

    return { queued: true as const, deduped: false as const };
  } catch (error) {
    void recordDiagnostic("error", "maintenance", "background_task_queue_failed", {
      route: "/api/deals/[id]",
      workspaceId: input.workspaceId,
      submissionId: input.submissionId,
      message: "We could not queue background cleanup.",
      error,
    });
    throw error;
  }
}

async function claimNextBackgroundTask(now: Date, taskType?: BackgroundTaskType): Promise<BackgroundTaskClaim | null> {
  const collection = await getBackgroundTasksCollection();
  const nowIso = now.toISOString();
  const leaseExpiresAt = getTaskLeaseExpiry(now).toISOString();

  const taskResult = await collection.findOneAndUpdate(
    {
      ...(taskType ? { type: taskType } : {}),
      $or: [
        { status: "pending", runAfter: { $lte: nowIso } },
        { status: "processing", leaseExpiresAt: { $lte: nowIso } },
      ],
    },
    {
      $set: {
        status: "processing",
        updatedAt: nowIso,
        lockedAt: nowIso,
        leaseExpiresAt,
        lastError: null,
      },
      $inc: {
        attempts: 1,
      },
    },
    {
      sort: { runAfter: 1, createdAt: 1 },
      returnDocument: "after",
    },
  );

  return unwrapFindOneAndUpdateResult(taskResult);
}

async function markBackgroundTaskSucceeded(task: BackgroundTaskClaim) {
  const collection = await getBackgroundTasksCollection();
  const now = new Date();
  const nowIso = now.toISOString();

  await collection.updateOne(
    { _id: task._id },
    {
      $set: {
        status: "succeeded",
        updatedAt: nowIso,
        completedAt: nowIso,
        leaseExpiresAt: null,
        lastError: null,
        expiresAt: getTaskExpiry(now),
      },
      $unset: {
        lockedAt: "",
      },
    },
  );
}

async function markBackgroundTaskFailed(task: BackgroundTaskClaim, error: unknown) {
  const collection = await getBackgroundTasksCollection();
  const now = new Date();
  const nowIso = now.toISOString();
  const retryable = task.attempts < 3;
  const nextRunAt = retryable ? getRetryRunAfter(now, task.attempts) : null;

  await collection.updateOne(
    { _id: task._id },
    {
      $set: {
        status: retryable ? "pending" : "failed",
        updatedAt: nowIso,
        leaseExpiresAt: null,
        lockedAt: null,
        lastError: normalizeTaskError(error),
        completedAt: retryable ? null : nowIso,
        runAfter: retryable && nextRunAt ? nextRunAt.toISOString() : task.runAfter,
        expiresAt: getTaskExpiry(now),
      },
    },
  );
}

async function runBackgroundTask(task: BackgroundTaskClaim) {
  switch (task.type) {
    case "attachment_cleanup":
      await deleteAttachment(
        task.payload.attachment ?? null,
        task.payload.baseDir ?? defaultDataDir,
      );
      return;
    default:
      throw new Error(`Unsupported background task type: ${String(task.type)}`);
  }
}

export async function processBackgroundTasks(options: {
  limit?: number;
  taskType?: BackgroundTaskType;
} = {}) {
  const limit = options.limit ?? 10;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (processed < limit) {
    const task = await claimNextBackgroundTask(new Date(), options.taskType);
    if (!task) {
      break;
    }

    processed += 1;

    try {
      void recordDiagnostic("info", "maintenance", "background_task_started", {
        route: "/api/maintenance/background-tasks",
        workspaceId: task.payload.workspaceId,
        submissionId: task.payload.submissionId,
        message: `Background task started: ${task.type}.`,
        details: {
          taskType: task.type,
          attempts: task.attempts,
        },
      });

      await runBackgroundTask(task);
      await markBackgroundTaskSucceeded(task);
      succeeded += 1;

      void recordDiagnostic("info", "maintenance", "background_task_finished", {
        route: "/api/maintenance/background-tasks",
        workspaceId: task.payload.workspaceId,
        submissionId: task.payload.submissionId,
        message: `Background task finished: ${task.type}.`,
        details: {
          taskType: task.type,
          attempts: task.attempts,
        },
      });
    } catch (error) {
      failed += 1;
      await markBackgroundTaskFailed(task, error);
      void recordDiagnostic("error", "maintenance", "background_task_failed", {
        route: "/api/maintenance/background-tasks",
        workspaceId: task.payload.workspaceId,
        submissionId: task.payload.submissionId,
        message: `Background task failed: ${task.type}.`,
        details: {
          taskType: task.type,
          attempts: task.attempts,
        },
        error,
      });
    }
  }

  return {
    processed,
    succeeded,
    failed,
  };
}

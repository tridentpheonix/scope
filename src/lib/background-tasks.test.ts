import { afterEach, describe, expect, it, vi } from "vitest";
import { processBackgroundTasks, queueAttachmentCleanupTask } from "./background-tasks";

type BackgroundTaskMock = {
  _id: string;
  type?: string;
  status?: string;
  dedupeKey?: string;
  attempts?: number;
  [key: string]: unknown;
};

const mongoMock = vi.hoisted(() => {
  const tasks: BackgroundTaskMock[] = [];
  return {
    tasks,
    collection: {
      findOne: vi.fn(async (filter) => tasks.find((task) => task.dedupeKey === filter.dedupeKey) ?? null),
      insertOne: vi.fn(async (doc) => {
        tasks.push(doc);
        return { insertedId: doc._id };
      }),
      updateOne: vi.fn(async (filter, update, options) => {
        void options;
        const task = tasks.find((item) => item._id === filter._id);
        if (task) {
          Object.assign(task, update.$set ?? {});
          if (update.$unset) {
            for (const key of Object.keys(update.$unset)) {
              delete task[key];
            }
          }
          if (update.$inc?.attempts) {
            task.attempts = (task.attempts ?? 0) + update.$inc.attempts;
          }
        }

        return { upsertedCount: 0, modifiedCount: task ? 1 : 0 };
      }),
      findOneAndUpdate: vi.fn(async (filter) => {
        const task = tasks.find(
          (item) =>
            item.status === "pending" &&
            (!filter?.type || item.type === filter.type) &&
            (!filter?.$or || filter.$or.length > 0),
        );
        if (!task) {
          return { value: null };
        }

        task.status = "processing";
        task.attempts = (task.attempts ?? 0) + 1;
        return { value: task };
      }),
    },
    ensureMongoIndexes: vi.fn(async () => {}),
    getMongoCollection: vi.fn(async () => mongoMock.collection),
    deleteAttachment: vi.fn(async () => {}),
    recordDiagnostic: vi.fn(async () => ({
      at: new Date().toISOString(),
      level: "info",
      area: "maintenance",
      event: "test",
    })),
  };
});

vi.mock("./mongo", () => ({
  ensureMongoIndexes: mongoMock.ensureMongoIndexes,
  getMongoCollection: mongoMock.getMongoCollection,
}));

vi.mock("./attachment-storage", () => ({
  deleteAttachment: mongoMock.deleteAttachment,
  normalizeSavedAttachment: (value: unknown) => value,
}));

vi.mock("./diagnostics", () => ({
  recordDiagnostic: mongoMock.recordDiagnostic,
}));

afterEach(() => {
  mongoMock.tasks.splice(0);
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("background tasks", () => {
  it("queues attachment cleanup work for later processing", async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017");
    vi.stubEnv("MONGODB_DB_NAME", "scopeos");

    const result = await queueAttachmentCleanupTask({
      workspaceId: "workspace-1",
      submissionId: "submission-1",
      attachment: {
        originalName: "brief.txt",
        storedName: "submission-1-brief.txt",
        mimeType: "text/plain",
        size: 12,
        storageKind: "filesystem",
        storageRef: "uploads/submission-1-brief.txt",
      },
    });

    expect(result.queued).toBe(true);
    expect(mongoMock.collection.insertOne).toHaveBeenCalled();
  });

  it("processes queued attachment cleanup tasks", async () => {
    vi.stubEnv("MONGODB_URI", "mongodb://127.0.0.1:27017");
    vi.stubEnv("MONGODB_DB_NAME", "scopeos");

    await queueAttachmentCleanupTask({
      workspaceId: "workspace-1",
      submissionId: "submission-1",
      attachment: {
        originalName: "brief.txt",
        storedName: "submission-1-brief.txt",
        mimeType: "text/plain",
        size: 12,
        storageKind: "filesystem",
        storageRef: "uploads/submission-1-brief.txt",
      },
    });

    const summary = await processBackgroundTasks({ limit: 5 });

    expect(summary).toMatchObject({
      processed: 1,
      succeeded: 1,
      failed: 0,
    });
    expect(mongoMock.deleteAttachment).toHaveBeenCalledTimes(1);
  });
});

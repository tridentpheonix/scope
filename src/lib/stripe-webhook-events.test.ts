import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateFilter } from "mongodb";
import {
  markStripeWebhookEventFailed,
  markStripeWebhookEventProcessed,
  reserveStripeWebhookEvent,
} from "./stripe-webhook-events";

type StoredWebhookEvent = {
  _id: string;
  eventType: string;
  status: "processing" | "processed" | "failed";
  attemptCount: number;
  createdAt: string;
  firstSeenAt: string;
  lastAttemptAt: string;
  updatedAt: string;
  processedAt: string | null;
  failedAt: string | null;
  expiresAt: Date;
  lastError: { name: string; message: string; stack?: string } | null;
};

const records = new Map<string, StoredWebhookEvent>();

const mongoMock = vi.hoisted(() => ({
  ensureMongoIndexes: vi.fn(async () => {}),
}));

vi.mock("./mongo", () => ({
  ensureMongoIndexes: mongoMock.ensureMongoIndexes,
    getMongoCollection: vi.fn(async () => ({
      findOne: vi.fn(async (filter: { _id: string }) => {
        return records.get(filter._id) ?? null;
      }),
      updateOne: vi.fn(
        async (
          filter: { _id: string; $or?: Array<Record<string, unknown>> },
          update: UpdateFilter<StoredWebhookEvent>,
          options?: { upsert?: boolean },
        ) => {
          const existing = records.get(filter._id);
          const isReservationUpsert =
            options?.upsert === true &&
            update.$set &&
            "status" in update.$set &&
            update.$set.status === "processing";

          const canUpdate = isReservationUpsert ? !existing || existing.status === "failed" : Boolean(existing);

          if (!canUpdate) {
            if (options?.upsert) {
              const duplicateError = new Error("duplicate key");
              (duplicateError as { code?: number }).code = 11000;
              throw duplicateError;
            }

            return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
          }

          const nowRecord = existing ?? {
            _id: filter._id,
            eventType: "",
            status: "processing" as const,
            attemptCount: 0,
            createdAt: "",
            firstSeenAt: "",
            lastAttemptAt: "",
            updatedAt: "",
            processedAt: null,
            failedAt: null,
            expiresAt: new Date(),
            lastError: null,
          };

        if (update.$setOnInsert && !existing) {
          Object.assign(nowRecord, update.$setOnInsert);
        }

        if (update.$set) {
          Object.assign(nowRecord, update.$set);
        }

        if (update.$inc) {
          for (const [field, amount] of Object.entries(update.$inc)) {
            nowRecord[field as keyof StoredWebhookEvent] = (
              (nowRecord[field as keyof StoredWebhookEvent] as number) + (amount as number)
            ) as never;
          }
        }

        if (update.$unset) {
          for (const field of Object.keys(update.$unset)) {
            if (field in nowRecord) {
              delete (nowRecord as Record<string, unknown>)[field];
            }
          }
        }

        records.set(filter._id, nowRecord as StoredWebhookEvent);

        return {
          matchedCount: existing ? 1 : 0,
          modifiedCount: 1,
          upsertedCount: existing ? 0 : 1,
        };
      },
    ),
  })),
}));

beforeEach(() => {
  records.clear();
  mongoMock.ensureMongoIndexes.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("stripe webhook event tracking", () => {
  it("reserves a fresh webhook event", async () => {
    const reservation = await reserveStripeWebhookEvent({
      id: "evt_1",
      type: "checkout.session.completed",
    } as never);

    expect(reservation).toEqual({
      reserved: true,
      eventId: "evt_1",
      retry: false,
      attempts: 1,
    });
    expect(records.get("evt_1")?.status).toBe("processing");
  });

  it("skips already processed webhook events", async () => {
    records.set("evt_2", {
      _id: "evt_2",
      eventType: "checkout.session.completed",
      status: "processed",
      attemptCount: 1,
      createdAt: "2026-04-21T00:00:00.000Z",
      firstSeenAt: "2026-04-21T00:00:00.000Z",
      lastAttemptAt: "2026-04-21T00:00:00.000Z",
      updatedAt: "2026-04-21T00:00:00.000Z",
      processedAt: "2026-04-21T00:00:00.000Z",
      failedAt: null,
      expiresAt: new Date("2026-10-18T00:00:00.000Z"),
      lastError: null,
    });

    const reservation = await reserveStripeWebhookEvent({
      id: "evt_2",
      type: "checkout.session.completed",
    } as never);

    expect(reservation).toEqual({
      reserved: false,
      eventId: "evt_2",
      reason: "processed",
    });
  });

  it("allows retrying a failed webhook event", async () => {
    records.set("evt_3", {
      _id: "evt_3",
      eventType: "checkout.session.completed",
      status: "failed",
      attemptCount: 1,
      createdAt: "2026-04-21T00:00:00.000Z",
      firstSeenAt: "2026-04-21T00:00:00.000Z",
      lastAttemptAt: "2026-04-21T00:00:00.000Z",
      updatedAt: "2026-04-21T00:00:00.000Z",
      processedAt: null,
      failedAt: "2026-04-21T00:00:00.000Z",
      expiresAt: new Date("2026-10-18T00:00:00.000Z"),
      lastError: {
        name: "Error",
        message: "boom",
      },
    });

    const reservation = await reserveStripeWebhookEvent({
      id: "evt_3",
      type: "checkout.session.completed",
    } as never);

    expect(reservation).toEqual({
      reserved: true,
      eventId: "evt_3",
      retry: true,
      attempts: 2,
    });
    expect(records.get("evt_3")?.status).toBe("processing");
  });

  it("marks events processed and failed", async () => {
    await reserveStripeWebhookEvent({
      id: "evt_4",
      type: "checkout.session.completed",
    } as never);

    await markStripeWebhookEventProcessed("evt_4");
    expect(records.get("evt_4")?.status).toBe("processed");
    expect(records.get("evt_4")?.processedAt).not.toBeNull();

    await markStripeWebhookEventFailed("evt_4", new Error("later failure"));
    expect(records.get("evt_4")?.status).toBe("failed");
    expect(records.get("evt_4")?.failedAt).not.toBeNull();
    expect(records.get("evt_4")?.lastError?.message).toBe("later failure");
  });
});

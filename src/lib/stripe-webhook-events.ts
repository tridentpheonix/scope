import type Stripe from "stripe";
import { isMongoConfigured } from "./env";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export type StripeWebhookEventStatus = "processing" | "processed" | "failed";

type StripeWebhookEventError = {
  name: string;
  message: string;
  stack?: string;
};

type StripeWebhookEventDocument = {
  _id: string;
  eventType: string;
  status: StripeWebhookEventStatus;
  attemptCount: number;
  createdAt: string;
  firstSeenAt: string;
  lastAttemptAt: string;
  updatedAt: string;
  processedAt: string | null;
  failedAt: string | null;
  expiresAt: Date;
  lastError: StripeWebhookEventError | null;
};

export type StripeWebhookEventSummary = {
  id: string;
  eventType: string;
  status: StripeWebhookEventStatus;
  attemptCount: number;
  firstSeenAt: string;
  lastAttemptAt: string;
  updatedAt: string;
  processedAt: string | null;
  failedAt: string | null;
  lastError: StripeWebhookEventError | null;
};

export type StripeWebhookReservation =
  | {
      reserved: true;
      eventId: string;
      retry: boolean;
      attempts: number;
    }
  | {
      reserved: false;
      eventId: string;
      reason: "duplicate" | "processing" | "processed";
    };

function isDuplicateKeyError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; message?: unknown };
  return (
    maybeError.code === 11000 ||
    maybeError.code === 11001 ||
    (typeof maybeError.message === "string" &&
      maybeError.message.toLowerCase().includes("duplicate key"))
  );
}

function normalizeWebhookError(error: unknown): StripeWebhookEventError {
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

function getWebhookExpiry(now: Date) {
  return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
}

async function getStripeWebhookEventsCollection() {
  await ensureMongoIndexes();
  return getMongoCollection<StripeWebhookEventDocument>("stripe_webhook_events");
}

export async function getRecentStripeWebhookEvents(limit = 8): Promise<StripeWebhookEventSummary[]> {
  if (!isMongoConfigured()) {
    return [];
  }

  const collection = await getStripeWebhookEventsCollection();
  const records = await collection
    .find({})
    .sort({ updatedAt: -1 })
    .limit(Math.max(1, Math.min(limit, 20)))
    .toArray();

  return records.map((record) => ({
    id: record._id,
    eventType: record.eventType,
    status: record.status,
    attemptCount: record.attemptCount,
    firstSeenAt: record.firstSeenAt,
    lastAttemptAt: record.lastAttemptAt,
    updatedAt: record.updatedAt,
    processedAt: record.processedAt,
    failedAt: record.failedAt,
    lastError: record.lastError,
  }));
}

export async function reserveStripeWebhookEvent(event: Stripe.Event): Promise<StripeWebhookReservation> {
  const collection = await getStripeWebhookEventsCollection();
  const now = new Date();
  const nowIso = now.toISOString();

  try {
    const result = await collection.updateOne(
      { _id: event.id, $or: [{ status: { $exists: false } }, { status: "failed" }] },
      {
        $set: {
          _id: event.id,
          eventType: event.type,
          status: "processing",
          lastAttemptAt: nowIso,
          updatedAt: nowIso,
          expiresAt: getWebhookExpiry(now),
          lastError: null,
        },
        $setOnInsert: {
          createdAt: nowIso,
          firstSeenAt: nowIso,
          attemptCount: 1,
          processedAt: null,
          failedAt: null,
        },
      },
      { upsert: true },
    );

    if (result.upsertedCount === 0 && result.modifiedCount === 0) {
      return {
        reserved: false,
        eventId: event.id,
        reason: "processed",
      };
    }

    if (result.modifiedCount > 0 && result.upsertedCount === 0) {
      await collection.updateOne(
        { _id: event.id },
        {
          $inc: {
            attemptCount: 1,
          },
          $set: {
            updatedAt: nowIso,
          },
        },
      );
    }

    const saved = await collection.findOne({ _id: event.id });
    return {
      reserved: true,
      eventId: event.id,
      retry: Boolean(saved && saved.attemptCount > 1),
      attempts: saved?.attemptCount ?? 1,
    };
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const existing = await collection.findOne({ _id: event.id });
    return {
      reserved: false,
      eventId: event.id,
      reason:
        existing?.status === "processing"
          ? "processing"
          : existing?.status === "processed"
            ? "processed"
            : "duplicate",
    };
  }
}

export async function markStripeWebhookEventProcessed(eventId: string) {
  const collection = await getStripeWebhookEventsCollection();
  const now = new Date().toISOString();

  await collection.updateOne(
    { _id: eventId },
    {
      $set: {
        status: "processed",
        processedAt: now,
        updatedAt: now,
        lastError: null,
        expiresAt: getWebhookExpiry(new Date()),
      },
      $unset: {
        failedAt: "",
      },
    },
  );
}

export async function markStripeWebhookEventFailed(eventId: string, error: unknown) {
  const collection = await getStripeWebhookEventsCollection();
  const now = new Date().toISOString();

  await collection.updateOne(
    { _id: eventId },
    {
      $set: {
        status: "failed",
        failedAt: now,
        updatedAt: now,
        lastError: normalizeWebhookError(error),
        expiresAt: getWebhookExpiry(new Date()),
      },
      $unset: {
        processedAt: "",
      },
    },
  );
}

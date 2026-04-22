import type { DiagnosticEntry } from "./diagnostics";
import { isMongoConfigured } from "./env";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";
import { getSystemHealthSnapshot, type SystemHealthSnapshot } from "./system-health";
import type { Collection } from "mongodb";

export type IncidentVisibilityDiagnostic = DiagnosticEntry & {
  id: string;
};

type DiagnosticEventDocument = DiagnosticEntry & {
  _id: string;
  createdAt: Date;
  expiresAt: Date;
};

type DiagnosticEventCollection = Collection<DiagnosticEventDocument>;

const diagnosticRetentionDays = 14;

function getDiagnosticExpiry(now: Date) {
  return new Date(now.getTime() + diagnosticRetentionDays * 24 * 60 * 60 * 1000);
}

async function getDiagnosticEventsCollection(): Promise<DiagnosticEventCollection> {
  await ensureMongoIndexes();
  return getMongoCollection<DiagnosticEventDocument>("diagnostic_events");
}

export async function mirrorDiagnosticEvent(entry: DiagnosticEntry) {
  if (!isMongoConfigured()) {
    return { stored: false as const };
  }

  try {
    const collection = await getDiagnosticEventsCollection();
    const createdAt = new Date(entry.at);

    await collection.insertOne({
      ...entry,
      _id: crypto.randomUUID(),
      createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
      expiresAt: getDiagnosticExpiry(new Date()),
    });

    return { stored: true as const };
  } catch {
    return { stored: false as const };
  }
}

export async function getRecentIncidentDiagnostics(limit = 8): Promise<IncidentVisibilityDiagnostic[]> {
  if (!isMongoConfigured()) {
    return [];
  }

  const collection = await getDiagnosticEventsCollection();
  const records = await collection
    .find({ level: { $in: ["warn", "error"] } })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 20)))
    .toArray();

  return records.map((record) => ({
    id: record._id,
    at: record.at,
    level: record.level,
    area: record.area,
    event: record.event,
    route: record.route,
    workspaceId: record.workspaceId,
    submissionId: record.submissionId,
    status: record.status,
    message: record.message,
    details: record.details,
    error: record.error,
  }));
}

export type IncidentVisibilitySnapshot = {
  health: SystemHealthSnapshot;
  recentDiagnostics: IncidentVisibilityDiagnostic[];
};

export async function getIncidentVisibilitySnapshot(options: {
  recentLimit?: number;
  healthNow?: Date;
} = {}): Promise<IncidentVisibilitySnapshot> {
  const [health, recentDiagnostics] = await Promise.all([
    getSystemHealthSnapshot({ now: options.healthNow }),
    getRecentIncidentDiagnostics(options.recentLimit),
  ]);

  return {
    health,
    recentDiagnostics,
  };
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { isNeonConfigured } from "./env";
import { isPlainObject, tryParseJson } from "./json-safe";
import type { AnalyticsEvent } from "./analytics";
import { readExportBlockerSignals, type ExportBlockerSignal } from "./export-blocker-storage";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

const defaultDataDir = path.join(process.cwd(), "data");

type AnalyticsEventDocument = {
  _id: string;
  workspaceId: string;
  name: string;
  submissionId?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

function shouldUseNeon(baseDir?: string) {
  return isNeonConfigured() && (!baseDir || baseDir === defaultDataDir);
}

export async function readAnalyticsEvents(baseDir = defaultDataDir, workspaceId?: string) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return [] satisfies AnalyticsEvent[];
    }

    await ensureMongoIndexes();
    const events = await getMongoCollection<AnalyticsEventDocument>("analytics_events");
    const rows = await events.find(
      { workspaceId },
      { sort: { createdAt: -1 } },
    ).toArray();

    return rows.map((row) => ({
      name: row.name,
      submissionId: row.submissionId ?? undefined,
      createdAt: row.createdAt,
      metadata: row.metadata ?? undefined,
    }));
  }

  const eventsFile = path.join(baseDir, "events.ndjson");

  try {
    const content = await fs.readFile(eventsFile, "utf8");

    return content
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line) => {
        const parsed = tryParseJson<AnalyticsEvent>(line);
        if (
          !isPlainObject(parsed) ||
          typeof parsed.name !== "string" ||
          typeof parsed.createdAt !== "string"
        ) {
          return [];
        }

        return [parsed as AnalyticsEvent];
      });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [] satisfies AnalyticsEvent[];
    }

    throw error;
  }
}

export async function saveAnalyticsEvent(
  event: AnalyticsEvent,
  options: {
    baseDir?: string;
    workspaceId?: string;
  } = {},
) {
  if (shouldUseNeon(options.baseDir)) {
    if (!options.workspaceId) {
      throw new Error("workspaceId is required for Mongo-backed analytics storage.");
    }

    await ensureMongoIndexes();
    const events = await getMongoCollection<AnalyticsEventDocument>("analytics_events");
    await events.insertOne({
      _id: crypto.randomUUID(),
      workspaceId: options.workspaceId,
      submissionId: event.submissionId ?? undefined,
      name: event.name,
      metadata: event.metadata,
      createdAt: event.createdAt,
    });

    return event;
  }

  const baseDir = options.baseDir ?? defaultDataDir;
  const eventsFile = path.join(baseDir, "events.ndjson");
  await fs.mkdir(baseDir, { recursive: true });
  await fs.appendFile(eventsFile, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

export type AnalyticsSummary = {
  totalEvents: number;
  countsByName: Record<string, number>;
  recentEvents: AnalyticsEvent[];
};

export type AnalyticsDashboard = {
  summary: AnalyticsSummary;
  exportBlockers: {
    totalSignals: number;
    recentSignals: ExportBlockerSignal[];
  };
};

export function summarizeAnalyticsEvents(events: AnalyticsEvent[], recentLimit = 20) {
  const countsByName: Record<string, number> = {};

  for (const event of events) {
    countsByName[event.name] = (countsByName[event.name] ?? 0) + 1;
  }

  const recentEvents = [...events]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, recentLimit);

  return {
    totalEvents: events.length,
    countsByName,
    recentEvents,
  } satisfies AnalyticsSummary;
}

export async function readAnalyticsDashboard(
  baseDir = defaultDataDir,
  workspaceId?: string,
  recentEventLimit = 25,
  recentBlockerLimit = 5,
) {
  if (shouldUseNeon(baseDir)) {
    if (!workspaceId) {
      return {
        summary: {
          totalEvents: 0,
          countsByName: {},
          recentEvents: [],
        },
        exportBlockers: {
          totalSignals: 0,
          recentSignals: [],
        },
      } satisfies AnalyticsDashboard;
    }

    await ensureMongoIndexes();
    const events = await getMongoCollection<AnalyticsEventDocument>("analytics_events");
    const [allEvents, exportBlockers] = await Promise.all([
      events.find({ workspaceId }).toArray(),
      readExportBlockerSignals(baseDir, workspaceId, recentBlockerLimit),
    ]);

    return {
      summary: summarizeAnalyticsEvents(
        allEvents.map((row) => ({
          name: row.name,
          submissionId: row.submissionId,
          createdAt: row.createdAt,
          metadata: row.metadata,
        })),
        recentEventLimit,
      ),
      exportBlockers: {
        totalSignals: (await readExportBlockerSignals(baseDir, workspaceId)).length,
        recentSignals: exportBlockers,
      },
    } satisfies AnalyticsDashboard;
  }

  const [events, exportBlockers] = await Promise.all([
    readAnalyticsEvents(baseDir, workspaceId),
    readExportBlockerSignals(baseDir, workspaceId),
  ]);

  const summary = summarizeAnalyticsEvents(events, recentEventLimit);
  const recentSignals = [...exportBlockers]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, recentBlockerLimit);

  return {
    summary,
    exportBlockers: {
      totalSignals: exportBlockers.length,
      recentSignals,
    },
  } satisfies AnalyticsDashboard;
}

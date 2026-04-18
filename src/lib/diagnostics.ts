import { promises as fs } from "node:fs";
import path from "node:path";
import { shipDiagnosticToWebhook } from "./observability";

export type DiagnosticLevel = "info" | "warn" | "error";
export type DiagnosticArea =
  | "auth"
  | "billing"
  | "intake"
  | "ai"
  | "webhook"
  | "deals"
  | "analytics"
  | "support"
  | "maintenance";

export type DiagnosticError = {
  name: string;
  message: string;
  stack?: string;
};

export type DiagnosticEntry = {
  at: string;
  level: DiagnosticLevel;
  area: DiagnosticArea;
  event: string;
  route?: string;
  workspaceId?: string;
  submissionId?: string;
  status?: number;
  message?: string;
  details?: Record<string, unknown>;
  error?: DiagnosticError;
};

type DiagnosticInput = Omit<DiagnosticEntry, "at" | "level" | "area" | "event" | "error"> & {
  error?: unknown;
  baseDir?: string;
};

const defaultDataDir = path.join(process.cwd(), "data");

function normalizeError(error: unknown): DiagnosticError | undefined {
  if (!error) {
    return undefined;
  }

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

export function createDiagnosticEntry(
  level: DiagnosticLevel,
  area: DiagnosticArea,
  event: string,
  options: DiagnosticInput = {},
): DiagnosticEntry {
  return {
    at: new Date().toISOString(),
    level,
    area,
    event,
    route: options.route,
    workspaceId: options.workspaceId,
    submissionId: options.submissionId,
    status: options.status,
    message: options.message,
    details: options.details,
    error: normalizeError(options.error),
  };
}

export async function recordDiagnostic(
  level: DiagnosticLevel,
  area: DiagnosticArea,
  event: string,
  options: DiagnosticInput = {},
) {
  const { baseDir = defaultDataDir } = options;
  const entry = createDiagnosticEntry(level, area, event, options);
  const line = JSON.stringify(entry);

  const logger = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  logger(line);

  void shipDiagnosticToWebhook(entry).catch(() => {
    // Hosted observability must never break the request path.
  });

  try {
    const diagnosticsFile = path.join(baseDir, "diagnostics.ndjson");
    await fs.mkdir(baseDir, { recursive: true });
    await fs.appendFile(diagnosticsFile, `${line}\n`, "utf8");
  } catch {
    // Diagnostics must never break the request path.
  }

  return entry;
}

import type { DiagnosticEntry } from "./diagnostics";

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function shouldShipDiagnostic(entry: DiagnosticEntry) {
  return entry.level === "warn" || entry.level === "error";
}

export function buildObservabilityPayload(entry: DiagnosticEntry) {
  return {
    source: "scopeos",
    environment: process.env.NODE_ENV ?? "development",
    ...entry,
  };
}

export async function shipDiagnosticToWebhook(entry: DiagnosticEntry) {
  const url = readEnv("OBSERVABILITY_WEBHOOK_URL");
  if (!url || !shouldShipDiagnostic(entry)) {
    return { shipped: false as const };
  }

  const secret = readEnv("OBSERVABILITY_WEBHOOK_SECRET");
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Observability-Secret": secret } : {}),
      },
      body: JSON.stringify(buildObservabilityPayload(entry)),
      signal: controller.signal,
    });

    return {
      shipped: response.ok,
      status: response.status,
    } as const;
  } catch {
    return { shipped: false as const };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

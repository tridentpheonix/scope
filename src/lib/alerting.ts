import type { DiagnosticEntry } from "./diagnostics";

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function shouldShipAlert(entry: DiagnosticEntry) {
  return entry.level === "error";
}

export function buildAlertPayload(entry: DiagnosticEntry) {
  return {
    source: "scopeos",
    kind: "alert",
    environment: process.env.NODE_ENV ?? "development",
    ...entry,
  };
}

export async function shipDiagnosticToAlertWebhook(entry: DiagnosticEntry) {
  const url = readEnv("ALERT_WEBHOOK_URL");
  if (!url || !shouldShipAlert(entry)) {
    return { shipped: false as const };
  }

  const secret = readEnv("ALERT_WEBHOOK_SECRET");
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Alert-Secret": secret } : {}),
      },
      body: JSON.stringify(buildAlertPayload(entry)),
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

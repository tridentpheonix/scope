import {
  isAuthConfigured,
  isAlertingConfigured,
  isBlobStorageConfigured,
  isMongoConfigured,
  isOpsAccessConfigured,
  isObservabilityConfigured,
  isMaintenanceCronConfigured,
  isStripeCheckoutConfigured,
  isStripeConfigured,
  isStripeWebhookConfigured,
} from "./env";
import { pingMongo } from "./mongo";

export type SystemHealthSnapshot = {
  ok: boolean;
  status: "healthy" | "unhealthy";
  at: string;
  checks: {
    mongo: {
      configured: boolean;
      ok: boolean;
      latencyMs: number | null;
      error: string | null;
    };
    auth: {
      configured: boolean;
      ok: boolean;
    };
    stripe: {
      configured: boolean;
      checkoutConfigured: boolean;
      webhookConfigured: boolean;
    };
    blob: {
      configured: boolean;
    };
    observability: {
      configured: boolean;
    };
    alerting: {
      configured: boolean;
    };
    operatorAccess: {
      configured: boolean;
    };
    maintenance: {
      configured: boolean;
    };
  };
};

type SystemHealthOptions = {
  now?: Date;
  pingMongoImpl?: () => Promise<void>;
};

export async function getSystemHealthSnapshot(options: SystemHealthOptions = {}) {
  const now = options.now ?? new Date();
  const mongoConfigured = isMongoConfigured();
  const authConfigured = isAuthConfigured();
  let mongoLatencyMs: number | null = null;
  let mongoError: string | null = null;
  let mongoOk = false;

  if (mongoConfigured) {
    const startedAt = Date.now();
    try {
      await (options.pingMongoImpl ?? pingMongo)();
      mongoOk = true;
      mongoLatencyMs = Date.now() - startedAt;
    } catch (error) {
      mongoOk = false;
      mongoLatencyMs = null;
      mongoError = error instanceof Error ? error.message : "MongoDB ping failed.";
    }
  }

  const ok = mongoOk && authConfigured;

  return {
    ok,
    status: ok ? "healthy" : "unhealthy",
    at: now.toISOString(),
    checks: {
      mongo: {
        configured: mongoConfigured,
        ok: mongoOk,
        latencyMs: mongoLatencyMs,
        error: mongoError,
      },
      auth: {
        configured: authConfigured,
        ok: authConfigured && mongoOk,
      },
      stripe: {
        configured: isStripeConfigured(),
        checkoutConfigured: isStripeCheckoutConfigured(),
        webhookConfigured: isStripeWebhookConfigured(),
      },
      blob: {
        configured: isBlobStorageConfigured(),
      },
      observability: {
        configured: isObservabilityConfigured(),
      },
      alerting: {
        configured: isAlertingConfigured(),
      },
      operatorAccess: {
        configured: isOpsAccessConfigured(),
      },
      maintenance: {
        configured: isMaintenanceCronConfigured(),
      },
    },
  } satisfies SystemHealthSnapshot;
}

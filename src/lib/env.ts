function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export const appEnv = {
  databaseUrl: readEnv("DATABASE_URL"),
  neonAuthBaseUrl: readEnv("NEON_AUTH_BASE_URL"),
  neonAuthCookieSecret: readEnv("NEON_AUTH_COOKIE_SECRET"),
  nvidiaApiBaseUrl: readEnv("NVIDIA_API_BASE_URL"),
  nvidiaApiKey: readEnv("NVIDIA_API_KEY"),
  nvidiaModel: readEnv("NVIDIA_MODEL"),
  aiApiBaseUrl: readEnv("AI_API_BASE_URL"),
  aiApiKey: readEnv("AI_API_KEY"),
  aiModel: readEnv("AI_MODEL"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  stripePriceSoloMonthly: readEnv("STRIPE_PRICE_SOLO_MONTHLY"),
  stripePriceTeamMonthly: readEnv("STRIPE_PRICE_TEAM_MONTHLY"),
  appBaseUrl: readEnv("APP_BASE_URL"),
  blobReadWriteToken: readEnv("BLOB_READ_WRITE_TOKEN"),
  observabilityWebhookUrl: readEnv("OBSERVABILITY_WEBHOOK_URL"),
  observabilityWebhookSecret: readEnv("OBSERVABILITY_WEBHOOK_SECRET"),
};

export function isNeonConfigured() {
  return Boolean(appEnv.databaseUrl);
}

export function isNeonAuthConfigured() {
  const url = appEnv.neonAuthBaseUrl;
  const secret = appEnv.neonAuthCookieSecret;

  return Boolean(
    url &&
      secret &&
      !url.includes("example.com") &&
      !url.includes("scopeos.app") && // Skip my own placeholder
      url.startsWith("https://"),
  );
}

export function isAiConfigured() {
  return Boolean(
    (appEnv.nvidiaApiKey || appEnv.aiApiKey) &&
      (appEnv.nvidiaModel || appEnv.aiModel),
  );
}

export function isBlobStorageConfigured() {
  return Boolean(appEnv.blobReadWriteToken);
}

export function isObservabilityConfigured() {
  return Boolean(appEnv.observabilityWebhookUrl);
}

export function isStripeConfigured() {
  return Boolean(
    appEnv.stripeSecretKey &&
      appEnv.stripeWebhookSecret &&
      appEnv.stripePriceSoloMonthly &&
      appEnv.stripePriceTeamMonthly,
  );
}

export function requireEnv(value: string | null, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

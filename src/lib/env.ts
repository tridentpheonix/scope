function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export const appEnv = {
  mongoUri: readEnv("MONGODB_URI"),
  mongoDbName: readEnv("MONGODB_DB_NAME"),
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

export function isMongoConfigured() {
  return Boolean(appEnv.mongoUri && appEnv.mongoDbName);
}

export function isAuthConfigured() {
  return isMongoConfigured();
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

export function isStripeCheckoutConfigured() {
  return Boolean(
    appEnv.stripeSecretKey &&
      appEnv.stripePriceSoloMonthly &&
      appEnv.stripePriceTeamMonthly,
  );
}

export function isStripeWebhookConfigured() {
  return Boolean(
    appEnv.stripeSecretKey &&
      appEnv.stripeWebhookSecret &&
      appEnv.stripePriceSoloMonthly &&
      appEnv.stripePriceTeamMonthly,
  );
}

export function isStripeConfigured() {
  return isStripeWebhookConfigured();
}

export function requireEnv(value: string | null, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

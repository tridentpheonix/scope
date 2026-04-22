function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export const appEnv = {
  mongoUri: readEnv("MONGODB_URI"),
  mongoDbName: readEnv("MONGODB_DB_NAME"),
  googleClientId: readEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: readEnv("GOOGLE_CLIENT_SECRET"),
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
  alertWebhookUrl: readEnv("ALERT_WEBHOOK_URL"),
  alertWebhookSecret: readEnv("ALERT_WEBHOOK_SECRET"),
  cronSecret: readEnv("CRON_SECRET"),
  opsOperatorEmails: readEnv("OPS_OPERATOR_EMAILS"),
};

export function isMongoConfigured() {
  return Boolean(appEnv.mongoUri && appEnv.mongoDbName);
}

export function isAuthConfigured() {
  return isMongoConfigured();
}

export function isGoogleAuthConfigured() {
  return Boolean(appEnv.googleClientId && appEnv.googleClientSecret);
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

export function isAlertingConfigured() {
  return Boolean(appEnv.alertWebhookUrl);
}

export function isMaintenanceCronConfigured() {
  return Boolean(appEnv.cronSecret);
}

export function getOpsOperatorEmails() {
  return (appEnv.opsOperatorEmails ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isOpsOperatorEmail(email: string) {
  return getOpsOperatorEmails().includes(email.trim().toLowerCase());
}

export function isOpsAccessConfigured() {
  return getOpsOperatorEmails().length > 0;
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

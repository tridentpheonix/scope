import { MongoClient, type Collection, type Document } from "mongodb";
import { appEnv, isMongoConfigured, requireEnv } from "./env";

declare global {
  var __scopeosMongoClientPromise: Promise<MongoClient> | undefined;
  var __scopeosMongoIndexesPromise: Promise<void> | undefined;
}

let clientPromise: Promise<MongoClient> | null = globalThis.__scopeosMongoClientPromise ?? null;

function getMongoClient() {
  if (!isMongoConfigured()) {
    throw new Error("MongoDB is not configured.");
  }

  if (!clientPromise) {
    const client = new MongoClient(requireEnv(appEnv.mongoUri, "MONGODB_URI"));
    clientPromise = client.connect();
    globalThis.__scopeosMongoClientPromise = clientPromise;
  }

  return clientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClient();
  return client.db(requireEnv(appEnv.mongoDbName, "MONGODB_DB_NAME"));
}

export async function pingMongo() {
  const db = await getMongoDb();
  await db.admin().ping();
}

export async function closeMongoConnection() {
  if (!clientPromise) {
    return;
  }

  const client = await clientPromise;
  await client.close();
  clientPromise = null;
  globalThis.__scopeosMongoClientPromise = undefined;
  globalThis.__scopeosMongoIndexesPromise = undefined;
}

export async function getMongoCollection<TSchema extends Document>(name: string) {
  const db = await getMongoDb();
  return db.collection<TSchema>(name);
}

type IndexSpec = {
  collection: string;
  index: Parameters<Collection["createIndex"]>[0];
  options?: Parameters<Collection["createIndex"]>[1];
};

const WORKSPACE_STRIPE_CUSTOMER_INDEX_NAME = "workspaces_stripe_customer_unique";
const workspaceStripeCustomerPartialFilter = {
  stripeCustomerId: { $type: "string" },
} as const;

const mongoIndexes: IndexSpec[] = [
  {
    collection: "users",
    index: { emailNormalized: 1 },
    options: { unique: true, name: "users_email_normalized_unique" },
  },
  {
    collection: "workspaces",
    index: { stripeCustomerId: 1 },
    options: {
      unique: true,
      partialFilterExpression: workspaceStripeCustomerPartialFilter,
      name: WORKSPACE_STRIPE_CUSTOMER_INDEX_NAME,
    },
  },
  {
    collection: "workspace_memberships",
    index: { userId: 1, workspaceId: 1 },
    options: { unique: true, name: "workspace_memberships_user_workspace_unique" },
  },
  {
    collection: "workspace_memberships",
    index: { userId: 1, createdAt: -1 },
    options: { name: "workspace_memberships_user_recent" },
  },
  {
    collection: "sessions",
    index: { tokenHash: 1 },
    options: { unique: true, name: "sessions_token_hash_unique" },
  },
  {
    collection: "sessions",
    index: { expiresAt: 1 },
    options: { expireAfterSeconds: 0, name: "sessions_expires_ttl" },
  },
  {
    collection: "auth_rate_limits",
    index: { expiresAt: 1 },
    options: { expireAfterSeconds: 0, name: "auth_rate_limits_expires_ttl" },
  },
  {
    collection: "stripe_webhook_events",
    index: { expiresAt: 1 },
    options: { expireAfterSeconds: 0, name: "stripe_webhook_events_expires_ttl" },
  },
  {
    collection: "stripe_webhook_events",
    index: { updatedAt: -1 },
    options: { name: "stripe_webhook_events_recent" },
  },
  {
    collection: "background_tasks",
    index: { status: 1, runAfter: 1, createdAt: 1 },
    options: { name: "background_tasks_pending_due" },
  },
  {
    collection: "background_tasks",
    index: { dedupeKey: 1 },
    options: { unique: true, sparse: true, name: "background_tasks_dedupe_unique" },
  },
  {
    collection: "background_tasks",
    index: { expiresAt: 1 },
    options: { expireAfterSeconds: 0, name: "background_tasks_expires_ttl" },
  },
  {
    collection: "diagnostic_events",
    index: { level: 1, createdAt: -1 },
    options: { name: "diagnostic_events_level_recent" },
  },
  {
    collection: "diagnostic_events",
    index: { expiresAt: 1 },
    options: { expireAfterSeconds: 0, name: "diagnostic_events_expires_ttl" },
  },
  {
    collection: "risk_check_submissions",
    index: { workspaceId: 1, createdAt: -1 },
    options: { name: "risk_check_submissions_workspace_recent" },
  },
  {
    collection: "extraction_reviews",
    index: { workspaceId: 1, updatedAt: -1 },
    options: { name: "extraction_reviews_workspace_recent" },
  },
  {
    collection: "proposal_packs",
    index: { workspaceId: 1, updatedAt: -1 },
    options: { name: "proposal_packs_workspace_recent" },
  },
  {
    collection: "change_orders",
    index: { workspaceId: 1, updatedAt: -1 },
    options: { name: "change_orders_workspace_recent" },
  },
  {
    collection: "analytics_events",
    index: { workspaceId: 1, createdAt: -1 },
    options: { name: "analytics_events_workspace_recent" },
  },
  {
    collection: "analytics_events",
    index: { workspaceId: 1, submissionId: 1, createdAt: -1 },
    options: { name: "analytics_events_workspace_submission_recent" },
  },
  {
    collection: "export_feedback",
    index: { workspaceId: 1, createdAt: -1 },
    options: { name: "export_feedback_workspace_recent" },
  },
  {
    collection: "ai_runs",
    index: { workspaceId: 1, submissionId: 1, runType: 1, createdAt: -1 },
    options: { name: "ai_runs_submission_recent" },
  },
  {
    collection: "pilot_feedback",
    index: { workspaceId: 1, createdAt: -1 },
    options: { name: "pilot_feedback_workspace_recent" },
  },
  {
    collection: "pilot_feedback",
    index: { workspaceId: 1, submissionId: 1, createdAt: -1 },
    options: { name: "pilot_feedback_workspace_submission_recent" },
  },
];

type MongoIndexInfoLike = {
  name?: string;
  key?: Record<string, unknown>;
  unique?: boolean;
  sparse?: boolean;
  partialFilterExpression?: unknown;
};

export function shouldRecreateWorkspaceStripeCustomerIndex(index: MongoIndexInfoLike | null | undefined) {
  if (!index || index.name !== WORKSPACE_STRIPE_CUSTOMER_INDEX_NAME) {
    return false;
  }

  const key = index.key ?? {};
  const partialFilter = index.partialFilterExpression as
    | {
        stripeCustomerId?: {
          $type?: unknown;
        };
      }
    | undefined;

  return (
    key.stripeCustomerId !== 1 ||
    index.unique !== true ||
    index.sparse === true ||
    partialFilter?.stripeCustomerId?.$type !== "string"
  );
}

async function ensureCompatibleMongoIndexes(db: Awaited<ReturnType<typeof getMongoDb>>) {
  const workspaces = db.collection("workspaces");
  const indexes = await workspaces.indexes();
  const stripeCustomerIndex = indexes.find((index) => index.name === WORKSPACE_STRIPE_CUSTOMER_INDEX_NAME);

  if (shouldRecreateWorkspaceStripeCustomerIndex(stripeCustomerIndex)) {
    await workspaces.dropIndex(WORKSPACE_STRIPE_CUSTOMER_INDEX_NAME);
  }
}

export async function ensureMongoIndexes() {
  if (!isMongoConfigured()) {
    return;
  }

  if (!globalThis.__scopeosMongoIndexesPromise) {
    globalThis.__scopeosMongoIndexesPromise = (async () => {
      const db = await getMongoDb();
      await ensureCompatibleMongoIndexes(db);

      for (const spec of mongoIndexes) {
        await db.collection(spec.collection).createIndex(spec.index, spec.options);
      }
    })();
  }

  await globalThis.__scopeosMongoIndexesPromise;
}

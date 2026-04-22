import { promises as fs } from "node:fs";
import path from "node:path";
import { BSON, type Collection, type Document } from "mongodb";
import { getMongoDb } from "./mongo";

export const DEFAULT_MONGO_BACKUP_COLLECTIONS = [
  "users",
  "sessions",
  "workspaces",
  "workspace_memberships",
  "risk_check_submissions",
  "extraction_reviews",
  "proposal_packs",
  "change_orders",
  "analytics_events",
  "export_feedback",
  "ai_runs",
  "pilot_feedback",
  "stripe_webhook_events",
  "auth_rate_limits",
] as const;

type BackupManifestCollection = {
  name: string;
  documentCount: number;
  fileName: string;
};

export type MongoBackupManifest = {
  createdAt: string;
  databaseName: string;
  collections: BackupManifestCollection[];
};

export type MongoBackupSummary = {
  backupDir: string;
  manifest: MongoBackupManifest;
};

export type MongoRestoreSummary = {
  backupDir: string;
  restoredCollections: Array<{
    name: string;
    documentCount: number;
  }>;
};

export type MongoBackupOptions = {
  baseDir?: string;
  backupName?: string;
  collections?: readonly string[];
};

export type MongoRestoreOptions = {
  backupDir: string;
  collections?: readonly string[];
  dropExisting?: boolean;
};

function normalizeCollections(collections?: readonly string[]) {
  const source = collections?.length ? collections : DEFAULT_MONGO_BACKUP_COLLECTIONS;
  return [...new Set(source.map((collection) => collection.trim()).filter(Boolean))];
}

export function serializeBackupDocument<TDocument extends Document>(document: TDocument) {
  return BSON.EJSON.serialize(document, { relaxed: false }) as Record<string, unknown>;
}

export function deserializeBackupDocument<TDocument extends Document>(document: unknown) {
  return BSON.EJSON.deserialize(document as Document) as TDocument;
}

async function writeJsonFile(filePath: string, value: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readJsonFile<TValue>(filePath: string) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as TValue;
}

function getBackupDir(baseDir: string | undefined, backupName: string | undefined) {
  const resolvedBaseDir = baseDir ?? path.join(process.cwd(), "backups");
  const prefix = backupName ?? `mongo-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  return path.join(resolvedBaseDir, prefix);
}

async function chunkInsert<TDocument extends Document>(collection: Collection<TDocument>, documents: TDocument[]) {
  const chunkSize = 1000;
  for (let i = 0; i < documents.length; i += chunkSize) {
    const chunk = documents.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      await collection.insertMany(chunk as never, { ordered: false });
    }
  }
}

export async function createMongoBackup(options: MongoBackupOptions = {}): Promise<MongoBackupSummary> {
  const db = await getMongoDb();
  const backupDir = getBackupDir(options.baseDir, options.backupName);
  await fs.mkdir(backupDir, { recursive: true });

  const collections = normalizeCollections(options.collections);
  const manifest: MongoBackupManifest = {
    createdAt: new Date().toISOString(),
    databaseName: db.databaseName,
    collections: [],
  };

  for (const collectionName of collections) {
    const documents = await db.collection<Document>(collectionName).find({}).toArray();
    const fileName = `${collectionName}.json`;
    await writeJsonFile(
      path.join(backupDir, fileName),
      documents.map((document) => serializeBackupDocument(document)),
    );
    manifest.collections.push({
      name: collectionName,
      documentCount: documents.length,
      fileName,
    });
  }

  await writeJsonFile(path.join(backupDir, "manifest.json"), manifest);

  return {
    backupDir,
    manifest,
  };
}

export async function restoreMongoBackup(options: MongoRestoreOptions): Promise<MongoRestoreSummary> {
  const db = await getMongoDb();
  const manifest = await readJsonFile<MongoBackupManifest>(path.join(options.backupDir, "manifest.json"));
  const targetCollections = normalizeCollections(options.collections);
  const manifestCollections = manifest.collections.filter((collection) =>
    targetCollections.includes(collection.name),
  );

  const restoredCollections: MongoRestoreSummary["restoredCollections"] = [];

  for (const collectionEntry of manifestCollections) {
    const filePath = path.join(options.backupDir, collectionEntry.fileName);
    const serializedDocuments = await readJsonFile<unknown[]>(filePath);
    const documents = serializedDocuments.map((document) => deserializeBackupDocument<Document>(document));
    const collection = db.collection<Document>(collectionEntry.name);

    if (options.dropExisting) {
      await collection.deleteMany({});
    }

    if (documents.length > 0) {
      await chunkInsert(collection, documents);
    }

    restoredCollections.push({
      name: collectionEntry.name,
      documentCount: documents.length,
    });
  }

  return {
    backupDir: options.backupDir,
    restoredCollections,
  };
}

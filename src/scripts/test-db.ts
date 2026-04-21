import { loadLocalEnvFile } from "./load-local-env";

async function main() {
  try {
    loadLocalEnvFile();
    const { closeMongoConnection, ensureMongoIndexes, getMongoDb } = await import("../lib/mongo");
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    await ensureMongoIndexes();
    await closeMongoConnection();
    console.log("MongoDB connection successful");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

void main();

import { loadLocalEnvFile } from "./load-local-env";

async function main() {
  try {
    loadLocalEnvFile();
    const mongoModule = (await import("../lib/mongo")) as typeof import("../lib/mongo") & {
      default?: typeof import("../lib/mongo");
    };
    const { closeMongoConnection, ensureMongoIndexes, getMongoDb } = mongoModule.default ?? mongoModule;
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

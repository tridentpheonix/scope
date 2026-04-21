import { readFileSync } from "node:fs";
import path from "node:path";

function loadLocalEnvFile() {
  if (process.env.MONGODB_URI && process.env.MONGODB_DB_NAME) {
    return;
  }

  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Leave process.env untouched when no local env file exists.
  }
}

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

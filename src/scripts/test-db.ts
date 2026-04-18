import { getMongoDb } from "../lib/mongo";

async function main() {
  try {
    const db = await getMongoDb();
    await db.command({ ping: 1 });
    console.log("MongoDB connection successful");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

void main();

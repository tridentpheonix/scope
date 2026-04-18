import { ensureMongoIndexes, getMongoDb } from "../src/lib/mongo";

async function main() {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  await ensureMongoIndexes();
  console.log("MongoDB bootstrap complete.");
}

main().catch((error) => {
  console.error("MongoDB bootstrap failed.", error);
  process.exitCode = 1;
});

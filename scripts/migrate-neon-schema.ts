import { ensureMongoIndexes, getMongoDb } from "../src/lib/mongo";

async function main() {
  const db = await getMongoDb();
  await db.command({ ping: 1 });
  await ensureMongoIndexes();
  console.log("MongoDB indexes ensured.");
}

main().catch((error) => {
  console.error("MongoDB index bootstrap failed.", error);
  process.exitCode = 1;
});

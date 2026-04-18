import { runNeonMigrations } from "../src/lib/db";

async function main() {
  await runNeonMigrations();
  console.log("Neon migrations applied.");
}

main().catch((error) => {
  console.error("Neon migration failed.", error);
  process.exitCode = 1;
});

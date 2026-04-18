import { runNeonMigrations } from "../src/lib/db";

async function main() {
  await runNeonMigrations();
  console.log("Neon schema bootstrap complete.");
}

main().catch((error) => {
  console.error("Neon schema bootstrap failed.", error);
  process.exitCode = 1;
});

import path from "node:path";
import { loadLocalEnvFile } from "../src/scripts/load-local-env";

function readFlag(name: string) {
  return process.argv.some((arg) => arg === name || arg.startsWith(`${name}=`));
}

function readValue(name: string) {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) {
    return direct.slice(name.length + 1);
  }

  const index = process.argv.indexOf(name);
  if (index >= 0 && index < process.argv.length - 1) {
    return process.argv[index + 1];
  }

  return null;
}

function readCollections() {
  const raw = readValue("--collections");
  if (!raw) {
    return undefined;
  }

  const collections = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return collections.length > 0 ? collections : undefined;
}

async function main() {
  loadLocalEnvFile();

  const backupDir = readValue("--backup-dir") ?? readValue("--backupDir");
  if (!backupDir) {
    throw new Error("Missing required --backup-dir argument.");
  }

  const { restoreMongoBackup } = await import("../src/lib/mongo-backup");
  const summary = await restoreMongoBackup({
    backupDir,
    collections: readCollections(),
    dropExisting: readFlag("--drop-existing"),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        ...summary,
        backupDir: path.resolve(summary.backupDir),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("mongo_restore_failed", error);
  process.exitCode = 1;
});

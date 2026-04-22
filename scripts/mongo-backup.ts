import path from "node:path";
import { loadLocalEnvFile } from "../src/scripts/load-local-env";

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

  const mongoBackupModule = (await import("../src/lib/mongo-backup")) as typeof import("../src/lib/mongo-backup") & {
    default?: typeof import("../src/lib/mongo-backup");
  };
  const { createMongoBackup } = mongoBackupModule.default ?? mongoBackupModule;
  const mongoModule = (await import("../src/lib/mongo")) as typeof import("../src/lib/mongo") & {
    default?: typeof import("../src/lib/mongo");
  };
  const { closeMongoConnection } = mongoModule.default ?? mongoModule;

  try {
    const summary = await createMongoBackup({
      baseDir: readValue("--base-dir") ?? readValue("--baseDir") ?? undefined,
      backupName: readValue("--name") ?? readValue("--backup-name") ?? undefined,
      collections: readCollections(),
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
  } finally {
    await closeMongoConnection();
  }
}

main().catch((error) => {
  console.error("mongo_backup_failed", error);
  process.exitCode = 1;
});

import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { loadLocalEnvFile } from "../src/scripts/load-local-env";
import { compareMongoBackupManifests } from "../src/lib/mongo-drill";

const require = createRequire(import.meta.url);
const tsxCliPath = path.join(path.dirname(require.resolve("tsx/package.json")), "dist", "cli.mjs");

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

function resolveBaseDir() {
  return path.resolve(readValue("--base-dir") ?? readValue("--baseDir") ?? path.join("backups", "drill-runs"));
}

function parseJsonOutput<T>(output: string, label: string) {
  try {
    return JSON.parse(output) as T;
  } catch (error) {
    throw new Error(
      `${label} did not return valid JSON.\n${output}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function runTsxJson(scriptPath: string, scriptArgs: string[], env: NodeJS.ProcessEnv) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, [tsxCliPath, scriptPath, ...scriptArgs], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve(stdout.trim());
        return;
      }

      reject(new Error(`Command failed (${scriptPath} ${scriptArgs.join(" ")}).\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`));
    });
  });
}

async function main() {
  loadLocalEnvFile();

  const sourceUri = process.env.MONGODB_URI;
  const sourceDbName = process.env.MONGODB_DB_NAME;
  const drillUri = process.env.DRILL_MONGODB_URI;
  const drillDbName = process.env.DRILL_MONGODB_DB_NAME;

  if (!sourceUri || !sourceDbName) {
    throw new Error("Missing source MongoDB configuration. Set MONGODB_URI and MONGODB_DB_NAME first.");
  }

  if (!drillUri || !drillDbName) {
    throw new Error("Missing drill target MongoDB configuration. Set DRILL_MONGODB_URI and DRILL_MONGODB_DB_NAME.");
  }

  if (drillUri.trim() === sourceUri.trim() && drillDbName.trim() === sourceDbName.trim()) {
    throw new Error("Drill target must differ from the source database. Use a staging MongoDB URI or a different database name.");
  }

  const collections = readCollections();
  const baseDir = resolveBaseDir();
  const backupName = readValue("--name") ?? readValue("--backup-name") ?? `drill-source-${new Date().toISOString().replace(/[:.]/g, "-")}`;

  const mongoBackupModule = (await import("../src/lib/mongo-backup")) as typeof import("../src/lib/mongo-backup") & {
    default?: typeof import("../src/lib/mongo-backup");
  };
  const { createMongoBackup } = mongoBackupModule.default ?? mongoBackupModule;
  const mongoModule = (await import("../src/lib/mongo")) as typeof import("../src/lib/mongo") & {
    default?: typeof import("../src/lib/mongo");
  };
  const { closeMongoConnection } = mongoModule.default ?? mongoModule;
  const sourceSummary = await createMongoBackup({
    baseDir,
    backupName,
    collections,
  });
  await closeMongoConnection();

  const restoreArgs = [
    "exec",
    "tsx",
    "scripts/mongo-restore.ts",
    "--backup-dir",
    sourceSummary.backupDir,
    "--drop-existing",
  ];
  if (collections?.length) {
    restoreArgs.push("--collections", collections.join(","));
  }

  const restoreOutput = await runTsxJson("scripts/mongo-restore.ts", restoreArgs, {
    ...process.env,
    MONGODB_URI: drillUri,
    MONGODB_DB_NAME: drillDbName,
  });
  const restoreSummary = parseJsonOutput<{
    ok: true;
    backupDir: string;
    restoredCollections: Array<{ name: string; documentCount: number }>;
  }>(restoreOutput, "mongo-restore");

  const verifyArgs = [
    "exec",
    "tsx",
    "scripts/mongo-backup.ts",
    "--base-dir",
    baseDir,
    "--name",
    readValue("--verify-name") ?? `drill-verify-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  ];
  if (collections?.length) {
    verifyArgs.push("--collections", collections.join(","));
  }

  const verifyOutput = await runTsxJson("scripts/mongo-backup.ts", verifyArgs, {
    ...process.env,
    MONGODB_URI: drillUri,
    MONGODB_DB_NAME: drillDbName,
  });
  const verifySummary = parseJsonOutput<{
    ok: true;
    backupDir: string;
    manifest: {
      createdAt: string;
      databaseName: string;
      collections: Array<{ name: string; documentCount: number; fileName: string }>;
    };
  }>(verifyOutput, "mongo-backup verification");

  const comparison = compareMongoBackupManifests(sourceSummary.manifest, verifySummary.manifest);

  const result = {
    ok: comparison.matches,
    backupDir: path.resolve(sourceSummary.backupDir),
    verificationBackupDir: path.resolve(verifySummary.backupDir),
    sourceManifest: sourceSummary.manifest,
    restoreSummary,
    verificationManifest: verifySummary.manifest,
    comparison,
  };

  if (!comparison.matches) {
    throw new Error(`Restore drill verification failed.\n${JSON.stringify(result, null, 2)}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("mongo_restore_drill_failed", error);
  process.exitCode = 1;
});

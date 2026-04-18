import { runAttachmentReconciliation } from "../src/lib/attachment-reconciliation";

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

async function main() {
  const dryRun = !readFlag("--apply");
  const baseDir = readValue("--base-dir") ?? readValue("--baseDir") ?? undefined;
  const workspaceId = readValue("--workspace") ?? readValue("--workspaceId") ?? undefined;
  const blobPrefix = readValue("--blob-prefix") ?? undefined;

  const summary = await runAttachmentReconciliation({
    baseDir,
    dryRun,
    workspaceId,
    blobPrefix,
  });

  console.log(
    JSON.stringify({
      ok: true,
      ...summary,
    }),
  );
}

main().catch((error) => {
  console.error("attachment_reconciliation_failed", error);
  process.exitCode = 1;
});

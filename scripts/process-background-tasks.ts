import { processBackgroundTasks } from "../src/lib/background-tasks";
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

async function main() {
  loadLocalEnvFile();

  const limitValue = Number(readValue("--limit") ?? "10");
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 25) : 10;

  const summary = await processBackgroundTasks({ limit });
  console.log(JSON.stringify({ ok: true, ...summary }));
}

main().catch((error) => {
  console.error("background_tasks_failed", error);
  process.exitCode = 1;
});

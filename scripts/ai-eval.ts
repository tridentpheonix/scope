import { formatAiEvaluationReport, runAiEvaluationSuite } from "../src/lib/ai-evaluation";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function applyEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("export ")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadLocalEnv() {
  const cwd = process.cwd();
  applyEnvFile(resolve(cwd, ".env.local"));
  applyEnvFile(resolve(cwd, ".env"));
}

function shouldSkipLiveEval(argv: string[]) {
  return (
    process.env.AI_EVAL_SKIP_LIVE === "1" ||
    process.env.AI_EVAL_LIVE === "0" ||
    argv.includes("--fallback-only")
  );
}

async function main() {
  loadLocalEnv();

  const includeLive = !shouldSkipLiveEval(process.argv.slice(2));
  const report = await runAiEvaluationSuite({
    includeLive,
  });

  console.log(formatAiEvaluationReport(report));
  console.log(JSON.stringify(report, null, 2));

  if (!report.passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("ai_eval_failed", error);
  process.exitCode = 1;
});

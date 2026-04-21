import { readFileSync } from "node:fs";
import path from "node:path";

export function loadLocalEnvFile() {
  if (process.env.MONGODB_URI && process.env.MONGODB_DB_NAME) {
    return;
  }

  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Leave process.env untouched when no local env file exists.
  }
}

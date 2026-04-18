import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { readAnalyticsDashboard, saveAnalyticsEvent } from "./analytics-storage";

const tempDirs: string[] = [];

async function createTempDataDir() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "scopeos-analytics-"));
  tempDirs.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("analytics dashboard storage", () => {
  it("summarizes analytics and export-blocker activity without scanning the UI directly", async () => {
    const baseDir = await createTempDataDir();

    await saveAnalyticsEvent(
      {
        name: "proposal_pack_opened",
        createdAt: "2026-04-12T01:00:00.000Z",
        submissionId: "deal-1",
      },
      { baseDir },
    );
    await saveAnalyticsEvent(
      {
        name: "proposal_pack_saved",
        createdAt: "2026-04-12T02:00:00.000Z",
        submissionId: "deal-1",
      },
      { baseDir },
    );
    await saveAnalyticsEvent(
      {
        name: "proposal_pack_opened",
        createdAt: "2026-04-12T03:00:00.000Z",
        submissionId: "deal-2",
      },
      { baseDir },
    );

    await fs.appendFile(
      path.join(baseDir, "export-blockers.ndjson"),
      `${JSON.stringify({
        createdAt: "2026-04-12T01:30:00.000Z",
        note: "Need Google Docs export.",
        submissionId: "deal-1",
        outcome: "needs-google-docs",
      })}\n`,
      "utf8",
    );
    await fs.appendFile(
      path.join(baseDir, "export-blockers.ndjson"),
      `${JSON.stringify({
        createdAt: "2026-04-12T02:30:00.000Z",
        note: "Need more theme options.",
        submissionId: "deal-2",
        outcome: "needs-theme-options",
      })}\n`,
      "utf8",
    );
    await fs.appendFile(
      path.join(baseDir, "export-blockers.ndjson"),
      `${JSON.stringify({
        createdAt: "2026-04-12T03:30:00.000Z",
        note: "PDF handoff is still clunky.",
        submissionId: "deal-3",
        outcome: "reduced-friction",
      })}\n`,
      "utf8",
    );
    await fs.appendFile(path.join(baseDir, "events.ndjson"), "not-json\n", "utf8");
    await fs.appendFile(
      path.join(baseDir, "export-blockers.ndjson"),
      `${JSON.stringify({ note: "missing createdAt" })}\n`,
      "utf8",
    );

    const dashboard = await readAnalyticsDashboard(baseDir, undefined, 2, 2);

    expect(dashboard.summary.totalEvents).toBe(3);
    expect(dashboard.summary.countsByName.proposal_pack_opened).toBe(2);
    expect(dashboard.summary.countsByName.proposal_pack_saved).toBe(1);
    expect(dashboard.summary.recentEvents).toHaveLength(2);
    expect(dashboard.summary.recentEvents[0].createdAt).toBe("2026-04-12T03:00:00.000Z");
    expect(dashboard.summary.recentEvents[1].createdAt).toBe("2026-04-12T02:00:00.000Z");

    expect(dashboard.exportBlockers.totalSignals).toBe(3);
    expect(dashboard.exportBlockers.recentSignals).toHaveLength(2);
    expect(dashboard.exportBlockers.recentSignals[0].submissionId).toBe("deal-3");
    expect(dashboard.exportBlockers.recentSignals[1].submissionId).toBe("deal-2");
  });
});

import { describe, expect, it } from "vitest";
import { compareMongoBackupManifests } from "./mongo-drill";

describe("mongo drill comparison", () => {
  it("reports matching manifests", () => {
    const comparison = compareMongoBackupManifests(
      {
        createdAt: "2026-04-22T00:00:00.000Z",
        databaseName: "source",
        collections: [
          { name: "users", documentCount: 3, fileName: "users.json" },
          { name: "sessions", documentCount: 1, fileName: "sessions.json" },
        ],
      },
      {
        createdAt: "2026-04-22T00:05:00.000Z",
        databaseName: "target",
        collections: [
          { name: "users", documentCount: 3, fileName: "users.json" },
          { name: "sessions", documentCount: 1, fileName: "sessions.json" },
        ],
      },
    );

    expect(comparison.matches).toBe(true);
    expect(comparison.missingCollections).toEqual([]);
    expect(comparison.extraCollections).toEqual([]);
    expect(comparison.mismatchedCollections).toEqual([]);
  });

  it("reports missing, extra, and mismatched collections", () => {
    const comparison = compareMongoBackupManifests(
      {
        createdAt: "2026-04-22T00:00:00.000Z",
        databaseName: "source",
        collections: [
          { name: "users", documentCount: 3, fileName: "users.json" },
          { name: "sessions", documentCount: 1, fileName: "sessions.json" },
          { name: "workspaces", documentCount: 2, fileName: "workspaces.json" },
        ],
      },
      {
        createdAt: "2026-04-22T00:05:00.000Z",
        databaseName: "target",
        collections: [
          { name: "users", documentCount: 2, fileName: "users.json" },
          { name: "analytics_events", documentCount: 4, fileName: "analytics_events.json" },
        ],
      },
    );

    expect(comparison.matches).toBe(false);
    expect(comparison.missingCollections).toEqual(["sessions", "workspaces"]);
    expect(comparison.extraCollections).toEqual(["analytics_events"]);
    expect(comparison.mismatchedCollections).toEqual([
      { name: "users", sourceCount: 3, targetCount: 2 },
    ]);
  });
});

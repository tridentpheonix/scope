import { describe, expect, it } from "vitest";
import { deserializeBackupDocument, serializeBackupDocument } from "./mongo-backup";

describe("mongo backup helpers", () => {
  it("round-trips dates and nested documents through EJSON", () => {
    const document = {
      _id: "doc-1",
      createdAt: new Date("2026-04-22T00:00:00.000Z"),
      nested: {
        expiresAt: new Date("2026-04-23T00:00:00.000Z"),
      },
    };

    const serialized = serializeBackupDocument(document);
    const restored = deserializeBackupDocument<typeof document>(serialized);

    expect(restored._id).toBe("doc-1");
    expect(restored.createdAt).toBeInstanceOf(Date);
    expect(restored.nested.expiresAt).toBeInstanceOf(Date);
    expect(restored.createdAt.toISOString()).toBe("2026-04-22T00:00:00.000Z");
    expect(restored.nested.expiresAt.toISOString()).toBe("2026-04-23T00:00:00.000Z");
  });
});

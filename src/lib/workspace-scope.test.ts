import { describe, expect, it } from "vitest";
import { assertWorkspaceOwnership } from "./workspace-scope";

describe("assertWorkspaceOwnership", () => {
  it("allows matching workspace ids", () => {
    expect(() =>
      assertWorkspaceOwnership("proposal pack", "workspace-a", "workspace-a"),
    ).not.toThrow();
  });

  it("allows missing existing ownership", () => {
    expect(() =>
      assertWorkspaceOwnership("proposal pack", "workspace-a", null),
    ).not.toThrow();
  });

  it("rejects cross-workspace writes", () => {
    expect(() =>
      assertWorkspaceOwnership("proposal pack", "workspace-a", "workspace-b"),
    ).toThrow("proposal pack belongs to a different workspace.");
  });
});

import { describe, expect, it } from "vitest";
import { workspaceRoles } from "./workspace-team";

describe("workspace roles", () => {
  it("supports owner, admin, and member roles", () => {
    expect(workspaceRoles).toEqual(["owner", "admin", "member"]);
  });
});

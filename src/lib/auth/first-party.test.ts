import { afterEach, describe, expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "./first-party";

const usersCollection = {
  findOne: vi.fn(),
  updateOne: vi.fn(),
  insertOne: vi.fn(),
};

const sessionsCollection = {
  deleteMany: vi.fn(),
};

vi.mock("../mongo", () => ({
  ensureMongoIndexes: vi.fn(async () => {}),
  getMongoCollection: vi.fn(async (name: string) => {
    if (name === "users") {
      return usersCollection;
    }

    if (name === "sessions") {
      return sessionsCollection;
    }

    throw new Error(`Unexpected collection: ${name}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("password changes", () => {
  it("changes the password and revokes all sessions", async () => {
    const { changePasswordForUser } = await import("./first-party");
    const originalHash = hashPassword("old-password");
    const user = {
      _id: "user-1",
      email: "owner@example.com",
      emailNormalized: "owner@example.com",
      name: "Owner",
      passwordHash: originalHash,
      googleSubject: null,
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    };

    usersCollection.findOne.mockResolvedValue(user);
    usersCollection.updateOne.mockResolvedValue({ acknowledged: true });
    sessionsCollection.deleteMany.mockResolvedValue({ acknowledged: true });

    await changePasswordForUser({
      userId: "user-1",
      currentPassword: "old-password",
      newPassword: "new-password",
    });

    expect(usersCollection.updateOne).toHaveBeenCalledTimes(1);
    const update = usersCollection.updateOne.mock.calls[0][1] as { $set: { passwordHash: string; updatedAt: string } };
    expect(verifyPassword("new-password", update.$set.passwordHash)).toBe(true);
    expect(sessionsCollection.deleteMany).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("rejects an invalid current password", async () => {
    const { changePasswordForUser } = await import("./first-party");
    usersCollection.findOne.mockResolvedValue({
      _id: "user-1",
      email: "owner@example.com",
      emailNormalized: "owner@example.com",
      name: "Owner",
      passwordHash: hashPassword("old-password"),
      googleSubject: null,
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
    });

    await expect(
      changePasswordForUser({
        userId: "user-1",
        currentPassword: "wrong-password",
        newPassword: "new-password",
      }),
    ).rejects.toThrow("invalid_current_password");
  });
});

describe("google auth linking", () => {
  it("links a Google identity to an existing password user", async () => {
    const { findOrCreateUserFromGoogleProfile } = await import("./first-party");
    usersCollection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: "user-1",
        email: "owner@example.com",
        emailNormalized: "owner@example.com",
        name: "Owner",
        passwordHash: hashPassword("old-password"),
        googleSubject: null,
        authProviders: ["password"],
        createdAt: "2026-04-22T00:00:00.000Z",
        updatedAt: "2026-04-22T00:00:00.000Z",
      });
    usersCollection.updateOne.mockResolvedValue({ acknowledged: true });

    const result = await findOrCreateUserFromGoogleProfile({
      email: "owner@example.com",
      name: "Owner Updated",
      googleSubject: "google-sub-123",
    });

    expect(usersCollection.updateOne).toHaveBeenCalledTimes(1);
    expect(result.user.authProviders).toEqual(expect.arrayContaining(["password", "google"]));
    expect(result.user.hasGoogleAuth).toBe(true);
  });
});

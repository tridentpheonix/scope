import { createHash, randomBytes } from "node:crypto";
import { normalizeEmail } from "./auth/first-party";
import { appEnv, isAuthConfigured, resolveAppOrigin } from "./env";
import { isEmailConfigured, sendTransactionalEmail } from "./email";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export const workspaceRoles = ["owner", "admin", "member"] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

export type TeamMember = {
  userId: string;
  email: string;
  name: string | null;
  role: WorkspaceRole;
  createdAt: string;
};

export type WorkspaceInvitation = {
  id: string;
  workspaceId: string;
  email: string;
  emailNormalized: string;
  role: WorkspaceRole;
  createdAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

type WorkspaceMembershipDocument = {
  _id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
};

type UserDocument = {
  _id: string;
  email: string;
  emailNormalized: string;
  name: string | null;
};

type WorkspaceDocument = {
  _id: string;
  name: string;
  ownerUserId: string;
};

type WorkspaceInvitationDocument = {
  _id: string;
  workspaceId: string;
  email: string;
  emailNormalized: string;
  role: WorkspaceRole;
  tokenHash: string;
  createdByUserId: string;
  createdAt: string;
  expiresAt: Date;
  acceptedAt: string | null;
  revokedAt: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isWorkspaceRole(value: string): value is WorkspaceRole {
  return workspaceRoles.includes(value as WorkspaceRole);
}

function mapInvitation(row: WorkspaceInvitationDocument): WorkspaceInvitation {
  return {
    id: row._id,
    workspaceId: row.workspaceId,
    email: row.email,
    emailNormalized: row.emailNormalized,
    role: row.role,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt.toISOString(),
    acceptedAt: row.acceptedAt,
    revokedAt: row.revokedAt,
  };
}

export async function getMembershipForUser(workspaceId: string, userId: string) {
  await ensureMongoIndexes();
  const memberships =
    await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  return memberships.findOne({ workspaceId, userId });
}

export async function requireWorkspaceAdmin(workspaceId: string, userId: string) {
  const membership = await getMembershipForUser(workspaceId, userId);
  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw new Error("workspace_admin_required");
  }
  return membership;
}

export async function readWorkspaceTeam(workspaceId: string) {
  await ensureMongoIndexes();
  const memberships =
    await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  const users = await getMongoCollection<UserDocument>("users");
  const invitations =
    await getMongoCollection<WorkspaceInvitationDocument>("workspace_invitations");

  const rows = await memberships.find({ workspaceId }, { sort: { createdAt: 1 } }).toArray();
  const memberUsers = rows.length
    ? await users.find({ _id: { $in: rows.map((row) => row.userId) } }).toArray()
    : [];
  const usersById = new Map(memberUsers.map((user) => [user._id, user]));

  const pendingInvites = await invitations
    .find(
      {
        workspaceId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { sort: { createdAt: -1 } },
    )
    .toArray();

  return {
    members: rows.map((row) => {
      const user = usersById.get(row.userId);
      return {
        userId: row.userId,
        email: user?.email ?? "Unknown user",
        name: user?.name ?? null,
        role: isWorkspaceRole(row.role) ? row.role : "member",
        createdAt: row.createdAt,
      } satisfies TeamMember;
    }),
    invitations: pendingInvites.map(mapInvitation),
  };
}

export async function createWorkspaceInvitation(options: {
  workspaceId: string;
  createdByUserId: string;
  email: string;
  role: WorkspaceRole;
  request: Request;
}) {
  if (!isAuthConfigured()) {
    throw new Error("auth_not_configured");
  }

  if (options.role === "owner") {
    throw new Error("owner_invite_not_supported");
  }

  await requireWorkspaceAdmin(options.workspaceId, options.createdByUserId);
  await ensureMongoIndexes();

  const invitations =
    await getMongoCollection<WorkspaceInvitationDocument>("workspace_invitations");
  const workspaces = await getMongoCollection<WorkspaceDocument>("workspaces");
  const workspace = await workspaces.findOne({ _id: options.workspaceId });
  const now = new Date();
  const rawToken = randomBytes(32).toString("base64url");
  const emailNormalized = normalizeEmail(options.email);
  const inviteId = crypto.randomUUID();

  await invitations.updateMany(
    {
      workspaceId: options.workspaceId,
      emailNormalized,
      acceptedAt: null,
      revokedAt: null,
    },
    { $set: { revokedAt: now.toISOString() } },
  );

  await invitations.insertOne({
    _id: inviteId,
    workspaceId: options.workspaceId,
    email: options.email.trim(),
    emailNormalized,
    role: options.role,
    tokenHash: hashToken(rawToken),
    createdByUserId: options.createdByUserId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
    acceptedAt: null,
    revokedAt: null,
  });

  const acceptUrl = new URL("/team/accept", resolveAppOrigin(options.request));
  acceptUrl.searchParams.set("token", rawToken);
  const workspaceName = workspace?.name ?? "ScopeOS workspace";

  if (isEmailConfigured()) {
    await sendTransactionalEmail({
      to: options.email.trim(),
      subject: `You're invited to ${workspaceName} on ScopeOS`,
      text: `You have been invited to ${workspaceName} on ScopeOS.\n\nAccept the invite: ${acceptUrl.toString()}\n\nThis invite expires in 7 days.`,
      html: `<h1>You're invited to ${workspaceName}</h1><p>Accept the invite to join this ScopeOS workspace.</p><p><a href="${acceptUrl.toString()}">Accept invite</a></p><p>This invite expires in 7 days.</p>`,
      idempotencyKey: `workspace-invite-${inviteId}`,
    });
  }

  return {
    invitationId: inviteId,
    acceptUrl: acceptUrl.toString(),
    emailConfigured: Boolean(appEnv.resendApiKey && appEnv.resendFromEmail),
  };
}

export async function revokeWorkspaceInvitation(options: {
  workspaceId: string;
  invitationId: string;
  actorUserId: string;
}) {
  await requireWorkspaceAdmin(options.workspaceId, options.actorUserId);
  const invitations =
    await getMongoCollection<WorkspaceInvitationDocument>("workspace_invitations");
  await invitations.updateOne(
    { _id: options.invitationId, workspaceId: options.workspaceId, acceptedAt: null },
    { $set: { revokedAt: new Date().toISOString() } },
  );
}

export async function acceptWorkspaceInvitation(options: {
  token: string;
  userId: string;
  userEmail: string;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  await ensureMongoIndexes();
  const invitations =
    await getMongoCollection<WorkspaceInvitationDocument>("workspace_invitations");
  const memberships =
    await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  const invite = await invitations.findOne({ tokenHash: hashToken(options.token) });

  if (
    !invite ||
    invite.acceptedAt ||
    invite.revokedAt ||
    !(invite.expiresAt instanceof Date) ||
    invite.expiresAt.getTime() <= now.getTime()
  ) {
    throw new Error("invalid_or_expired_invitation");
  }

  if (normalizeEmail(options.userEmail) !== invite.emailNormalized) {
    throw new Error("invitation_email_mismatch");
  }

  await memberships.updateOne(
    { _id: `${invite.workspaceId}:${options.userId}` },
    {
      $setOnInsert: {
        _id: `${invite.workspaceId}:${options.userId}`,
        workspaceId: invite.workspaceId,
        userId: options.userId,
        role: invite.role,
        createdAt: new Date(0).toISOString(),
      },
    },
    { upsert: true },
  );
  await invitations.updateOne(
    { _id: invite._id, acceptedAt: null },
    { $set: { acceptedAt: now.toISOString() } },
  );

  return { workspaceId: invite.workspaceId };
}

async function countOwners(workspaceId: string) {
  const memberships =
    await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  return memberships.countDocuments({ workspaceId, role: "owner" });
}

export async function updateWorkspaceMemberRole(options: {
  workspaceId: string;
  targetUserId: string;
  role: WorkspaceRole;
  actorUserId: string;
}) {
  await requireWorkspaceAdmin(options.workspaceId, options.actorUserId);
  const memberships =
    await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  const target = await memberships.findOne({
    workspaceId: options.workspaceId,
    userId: options.targetUserId,
  });
  if (!target) {
    throw new Error("member_not_found");
  }
  if (target.role === "owner" && options.role !== "owner" && (await countOwners(options.workspaceId)) <= 1) {
    throw new Error("last_owner_required");
  }
  await memberships.updateOne(
    { _id: target._id },
    { $set: { role: options.role } },
  );
}

export async function removeWorkspaceMember(options: {
  workspaceId: string;
  targetUserId: string;
  actorUserId: string;
}) {
  await requireWorkspaceAdmin(options.workspaceId, options.actorUserId);
  const memberships =
    await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  const target = await memberships.findOne({
    workspaceId: options.workspaceId,
    userId: options.targetUserId,
  });
  if (!target) {
    throw new Error("member_not_found");
  }
  if (target.role === "owner" && (await countOwners(options.workspaceId)) <= 1) {
    throw new Error("last_owner_required");
  }
  await memberships.deleteOne({ _id: target._id });
}

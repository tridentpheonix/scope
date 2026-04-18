import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export type WorkspaceRecord = {
  id: string;
  ownerUserId: string;
  name: string;
  planKey: "free" | "solo" | "team";
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceDocument = {
  _id: string;
  ownerUserId: string;
  name: string;
  planKey: "free" | "solo" | "team";
  subscriptionStatus: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceMembershipDocument = {
  _id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "member";
  createdAt: string;
};

function mapWorkspace(document: WorkspaceDocument): WorkspaceRecord {
  return {
    id: document._id,
    ownerUserId: document.ownerUserId,
    name: document.name,
    planKey: document.planKey,
    subscriptionStatus: document.subscriptionStatus,
    stripeCustomerId: document.stripeCustomerId,
    stripeSubscriptionId: document.stripeSubscriptionId,
    stripePriceId: document.stripePriceId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function getWorkspaceForUser(userId: string) {
  await ensureMongoIndexes();

  const memberships = await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  const workspaces = await getMongoCollection<WorkspaceDocument>("workspaces");
  const membership = await memberships.findOne(
    { userId },
    { sort: { createdAt: 1 } },
  );

  if (!membership) {
    return null;
  }

  const workspace = await workspaces.findOne({ _id: membership.workspaceId });
  return workspace ? mapWorkspace(workspace) : null;
}

export async function ensureWorkspaceForUser(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  await ensureMongoIndexes();

  const existing = await getWorkspaceForUser(user.id);
  if (existing) {
    return existing;
  }

  const workspaces = await getMongoCollection<WorkspaceDocument>("workspaces");
  const memberships = await getMongoCollection<WorkspaceMembershipDocument>("workspace_memberships");
  const workspaceId = crypto.randomUUID();
  const now = new Date().toISOString();
  const workspaceName =
    user.name?.trim() || `${user.email.split("@")[0]}'s ScopeOS workspace`;

  await workspaces.insertOne({
    _id: workspaceId,
    ownerUserId: user.id,
    name: workspaceName,
    planKey: "free",
    subscriptionStatus: "inactive",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    createdAt: now,
    updatedAt: now,
  });

  await memberships.insertOne({
    _id: `${workspaceId}:${user.id}`,
    workspaceId,
    userId: user.id,
    role: "owner",
    createdAt: now,
  });

  return await getWorkspaceById(workspaceId);
}

export async function getWorkspaceById(workspaceId: string) {
  await ensureMongoIndexes();

  const workspaces = await getMongoCollection<WorkspaceDocument>("workspaces");
  const workspace = await workspaces.findOne({ _id: workspaceId });
  return workspace ? mapWorkspace(workspace) : null;
}

export async function getWorkspaceByStripeCustomerId(stripeCustomerId: string) {
  await ensureMongoIndexes();

  const workspaces = await getMongoCollection<WorkspaceDocument>("workspaces");
  const workspace = await workspaces.findOne({ stripeCustomerId });
  return workspace ? mapWorkspace(workspace) : null;
}

export async function updateWorkspaceBilling(
  workspaceId: string,
  updates: Partial<{
    planKey: "free" | "solo" | "team";
    subscriptionStatus: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
  }>,
) {
  await ensureMongoIndexes();

  const workspaces = await getMongoCollection<WorkspaceDocument>("workspaces");
  const current = await workspaces.findOne({ _id: workspaceId });
  if (!current) {
    return null;
  }

  const next = {
    planKey: updates.planKey ?? current.planKey,
    subscriptionStatus: updates.subscriptionStatus ?? current.subscriptionStatus,
    stripeCustomerId:
      typeof updates.stripeCustomerId === "undefined"
        ? current.stripeCustomerId
        : updates.stripeCustomerId,
    stripeSubscriptionId:
      typeof updates.stripeSubscriptionId === "undefined"
        ? current.stripeSubscriptionId
        : updates.stripeSubscriptionId,
    stripePriceId:
      typeof updates.stripePriceId === "undefined"
        ? current.stripePriceId
        : updates.stripePriceId,
  };

  await workspaces.updateOne(
    { _id: workspaceId },
    {
      $set: {
        ...next,
        updatedAt: new Date().toISOString(),
      },
    },
  );

  return await getWorkspaceById(workspaceId);
}

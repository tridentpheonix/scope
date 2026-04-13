import { dbQuery } from "./db";
import { isNeonConfigured } from "./env";

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

type WorkspaceRow = {
  id: string;
  owner_user_id: string;
  name: string;
  plan_key: "free" | "solo" | "team";
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapWorkspace(row: WorkspaceRow): WorkspaceRecord {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    planKey: row.plan_key,
    subscriptionStatus: row.subscription_status,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkspaceForUser(userId: string) {
  if (!isNeonConfigured()) {
    return null;
  }

  const rows = await dbQuery<WorkspaceRow>(
    `
      SELECT w.*
      FROM app_workspaces w
      INNER JOIN app_workspace_memberships m
        ON m.workspace_id = w.id
      WHERE m.user_id = $1
      ORDER BY w.created_at ASC
      LIMIT 1
    `,
    [userId],
  );

  return rows[0] ? mapWorkspace(rows[0]) : null;
}

export async function ensureWorkspaceForUser(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const existing = await getWorkspaceForUser(user.id);
  if (existing) {
    return existing;
  }

  const workspaceId = crypto.randomUUID();
  const workspaceName =
    user.name?.trim() || `${user.email.split("@")[0]}'s ScopeOS workspace`;

  await dbQuery(
    `
      INSERT INTO app_workspaces (
        id, owner_user_id, name, plan_key, subscription_status, created_at, updated_at
      )
      VALUES ($1, $2, $3, 'free', 'inactive', $4, $4)
    `,
    [workspaceId, user.id, workspaceName, new Date().toISOString()],
  );

  await dbQuery(
    `
      INSERT INTO app_workspace_memberships (workspace_id, user_id, role)
      VALUES ($1, $2, 'owner')
    `,
    [workspaceId, user.id],
  );

  return await getWorkspaceForUser(user.id);
}

export async function getWorkspaceById(workspaceId: string) {
  const rows = await dbQuery<WorkspaceRow>(
    `SELECT * FROM app_workspaces WHERE id = $1 LIMIT 1`,
    [workspaceId],
  );

  return rows[0] ? mapWorkspace(rows[0]) : null;
}

export async function getWorkspaceByStripeCustomerId(stripeCustomerId: string) {
  const rows = await dbQuery<WorkspaceRow>(
    `SELECT * FROM app_workspaces WHERE stripe_customer_id = $1 LIMIT 1`,
    [stripeCustomerId],
  );

  return rows[0] ? mapWorkspace(rows[0]) : null;
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
  const current = await getWorkspaceById(workspaceId);
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

  await dbQuery(
    `
      UPDATE app_workspaces
      SET
        plan_key = $2,
        subscription_status = $3,
        stripe_customer_id = $4,
        stripe_subscription_id = $5,
        stripe_price_id = $6,
        updated_at = $7
      WHERE id = $1
    `,
    [
      workspaceId,
      next.planKey,
      next.subscriptionStatus,
      next.stripeCustomerId,
      next.stripeSubscriptionId,
      next.stripePriceId,
      new Date().toISOString(),
    ],
  );

  return await getWorkspaceById(workspaceId);
}

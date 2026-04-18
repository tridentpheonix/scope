import { redirect } from "next/navigation";
import { readAuthenticatedUserFromCookies } from "./first-party";
import { ensureWorkspaceForUser } from "../workspace-billing";

export const auth = null;

export async function getCurrentSession() {
  return await readAuthenticatedUserFromCookies();
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export async function getCurrentWorkspaceContext() {
  const user = await requireCurrentUser();
  return await getWorkspaceContextForUser(user);
}

export async function getCurrentWorkspaceContextOrNull() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return await getWorkspaceContextForUser(user);
}

async function getWorkspaceContextForUser(user: {
  id: string;
  email: string;
  name?: string | null;
}) {
  const workspace = await ensureWorkspaceForUser({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    user,
    workspace,
  };
}

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createNeonAuth } from "@neondatabase/auth/next/server";
import { appEnv, isNeonAuthConfigured, isNeonConfigured } from "../env";
import { ensureWorkspaceForUser } from "../workspace-billing";

const authInstance = isNeonAuthConfigured()
  ? createNeonAuth({
      baseUrl: appEnv.neonAuthBaseUrl!,
      cookies: {
        secret: appEnv.neonAuthCookieSecret!,
        sessionDataTtl: 300,
      },
    })
  : null;

export const auth = authInstance;

export async function getCurrentSession() {
  if (!auth) {
    return await getDevSessionFromCookie();
  }

  const { data: session } = await auth.getSession({
    query: {
      disableCookieCache: "true",
    },
  });
  return session ?? (await getDevSessionFromCookie());
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
  if (!isNeonConfigured()) {
    return {
      user,
      workspace: null,
    };
  }

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

async function getDevSessionFromCookie() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get("scopeos-dev-auth-session")?.value;
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as {
      token?: string;
      user?: { id: string; email: string; name?: string | null };
    };

    if (!parsed.user?.id || !parsed.user.email) {
      return null;
    }

    return {
      user: parsed.user,
      token: parsed.token ?? null,
    };
  } catch {
    return null;
  }
}

"use client";

type ClientFetchOptions = {
  throw?: boolean;
};

async function request<T>(
  path: string,
  body?: Record<string, unknown>,
  fetchOptions?: ClientFetchOptions,
) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string; [key: string]: unknown }
    | null;

  if (!response.ok || payload?.ok === false) {
    const error = new Error(payload?.message ?? "Authentication request failed.");
    if (fetchOptions?.throw) {
      throw error;
    }

    return {
      data: null,
      error: {
        message: error.message,
      },
    } as const;
  }

  return {
    data: payload as T,
    error: null,
  } as const;
}

export const authClient = {
  signUp: {
    email: async ({
      email,
      password,
      name,
      fetchOptions,
    }: {
      email: string;
      password: string;
      name?: string;
      callbackURL?: string;
      fetchOptions?: ClientFetchOptions;
    }) => {
      const result = await request<{ ok: true; user: { id: string; email: string; name: string | null } }>(
        "/api/auth/sign-up",
        { email, password, name },
        fetchOptions,
      );
      return result.data ?? result;
    },
  },
  signIn: {
    email: async ({
      email,
      password,
      fetchOptions,
    }: {
      email: string;
      password: string;
      callbackURL?: string;
      fetchOptions?: ClientFetchOptions;
    }) => {
      const result = await request<{ ok: true; user: { id: string; email: string; name: string | null } }>(
        "/api/auth/sign-in",
        { email, password },
        fetchOptions,
      );
      return result.data ?? result;
    },
    social: async () => {
      throw new Error("Social sign-in is not available in the first-party auth flow.");
    },
  },
  signOut: async ({
    fetchOptions,
  }: {
    query?: Record<string, unknown>;
    fetchOptions?: ClientFetchOptions;
  } = {}) => {
    const result = await request<{ ok: true }>("/api/auth/sign-out", {}, fetchOptions);
    return result.data ?? result;
  },
};

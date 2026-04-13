import { auth } from "@/lib/auth/server";

if (!auth) {
  throw new Error("Neon Auth is not configured.");
}

export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();

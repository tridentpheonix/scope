import { NextResponse } from "next/server";
import { clearAuthCookie, revokeSessionFromRequest } from "@/lib/auth/first-party";

export async function POST() {
  await revokeSessionFromRequest();
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}

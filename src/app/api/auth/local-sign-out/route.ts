import { NextResponse } from "next/server";

const cookiesToClear = [
  "__Secure-neon-auth.session_token",
  "__Secure-neon-auth.local.session_data",
  "__Secure-neon-auth.session_challange",
  "scopeos-dev-auth-session",
] as const;

export async function POST() {
  const response = NextResponse.json({ ok: true });

  for (const name of cookiesToClear) {
    response.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
  }

  return response;
}

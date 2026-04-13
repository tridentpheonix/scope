import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { isNeonAuthConfigured } from "@/lib/env";

export async function POST(request: Request) {
  if (!isNeonAuthConfigured()) {
    return NextResponse.json({ ok: false, message: "Authentication is not configured." }, { status: 503 });
  }

  if (!auth) {
    return NextResponse.json({ ok: false, message: "Authentication is not configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as
    | { mode?: string; email?: string; password?: string; name?: string }
    | null;

  if (!body?.email || !body.password || !body.mode) {
    return NextResponse.json(
      { ok: false, message: "Missing email, password, or auth mode." },
      { status: 400 },
    );
  }

  const authResult =
    body.mode === "sign-up"
      ? await auth.signUp.email({
          email: body.email,
          password: body.password,
          name: body.name ?? "",
        })
      : await auth.signIn.email({
          email: body.email,
          password: body.password,
        });

  if (authResult.error) {
    return NextResponse.json(
      { ok: false, message: authResult.error.message ?? "Authentication failed." },
      { status: 400 },
    );
  }

  if (body.mode === "sign-up") {
    const signInResult = await auth.signIn.email({
      email: body.email,
      password: body.password,
    });

    if (signInResult.error) {
      return NextResponse.json(
        { ok: false, message: signInResult.error.message ?? "Authentication failed." },
        { status: 400 },
      );
    }
  }

  const response = NextResponse.json({ ok: true });
  if (authResult.data?.token) {
    response.cookies.set({
      name: "scopeos-dev-auth-session",
      value: encodeURIComponent(
        JSON.stringify({
          token: authResult.data.token,
          user: authResult.data.user,
        }),
      ),
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    response.headers.set("set-auth-jwt", authResult.data.token);
  }

  return response;
}

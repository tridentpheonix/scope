import { NextResponse } from "next/server";
import {
  createGoogleOauthSession,
  getGoogleOauthCookieOptions,
  GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
} from "@/lib/auth/google";
import { isAuthConfigured, isGoogleAuthConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const appOrigin = new URL(request.url).origin;

  if (!isAuthConfigured() || !isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL("/auth/sign-in?google=unavailable", appOrigin));
  }

  const { state, codeVerifier, authUrl } = createGoogleOauthSession(request);
  const response = NextResponse.redirect(authUrl);
  const cookieOptions = getGoogleOauthCookieOptions();

  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE_NAME,
    value: state,
    ...cookieOptions,
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME,
    value: codeVerifier,
    ...cookieOptions,
  });

  return response;
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { attachSessionCookie, findOrCreateUserFromGoogleProfile } from "@/lib/auth/first-party";
import {
  clearGoogleOauthCookies,
  exchangeGoogleCode,
  fetchGoogleUserProfile,
  GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  validateGoogleOauthState,
} from "@/lib/auth/google";
import { recordDiagnostic } from "@/lib/diagnostics";
import { isAuthConfigured, isGoogleAuthConfigured } from "@/lib/env";
import { ensureWorkspaceForUser } from "@/lib/workspace-billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildRedirect(request: Request, pathWithQuery: string) {
  return NextResponse.redirect(new URL(pathWithQuery, new URL(request.url).origin));
}

export async function GET(request: Request) {
  if (!isAuthConfigured() || !isGoogleAuthConfigured()) {
    return buildRedirect(request, "/auth/sign-in?google=unavailable");
  }

  const requestUrl = new URL(request.url);
  const error = requestUrl.searchParams.get("error");
  if (error === "access_denied") {
    return buildRedirect(request, "/auth/sign-in?google=cancelled");
  }

  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE_NAME)?.value ?? null;
  const codeVerifier = cookieStore.get(GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME)?.value ?? null;

  if (!code || !validateGoogleOauthState(expectedState, state) || !codeVerifier) {
    const response = buildRedirect(request, "/auth/sign-in?google=failed");
    clearGoogleOauthCookies(response);
    return response;
  }

  try {
    const tokenResponse = await exchangeGoogleCode({
      request,
      code,
      codeVerifier,
    });
    const profile = await fetchGoogleUserProfile(tokenResponse.access_token as string);

    if (!profile.email_verified) {
      const response = buildRedirect(request, "/auth/sign-in?google=unverified");
      clearGoogleOauthCookies(response);
      return response;
    }

    const authResult = await findOrCreateUserFromGoogleProfile({
      email: profile.email,
      name: profile.name ?? null,
      googleSubject: profile.sub,
    });

    await ensureWorkspaceForUser(authResult.user);

    const response = buildRedirect(request, "/risk-check");
    clearGoogleOauthCookies(response);
    await attachSessionCookie(response, authResult.user.id);
    return response;
  } catch (error) {
    void recordDiagnostic("error", "auth", "auth_google_callback_failed", {
      route: "/api/auth/google/callback",
      status: 500,
      message: error instanceof Error ? error.message : "Google sign-in failed.",
    });

    const response = buildRedirect(request, "/auth/sign-in?google=failed");
    clearGoogleOauthCookies(response);
    return response;
  }
}

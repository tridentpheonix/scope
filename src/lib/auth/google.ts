import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { appEnv, requireEnv } from "../env";

export const GOOGLE_OAUTH_STATE_COOKIE_NAME = "scopeos-google-oauth-state";
export const GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME = "scopeos-google-oauth-code-verifier";

const GOOGLE_AUTH_BASE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS = 60 * 10;

type GoogleTokenResponse = {
  access_token?: string;
};

export type GoogleUserProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

function getAppOrigin(request: Request) {
  return appEnv.appBaseUrl ?? new URL(request.url).origin;
}

export function getGoogleCallbackUrl(request: Request) {
  return new URL("/api/auth/google/callback", getAppOrigin(request)).toString();
}

function buildCodeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function createGoogleOauthSession(request: Request) {
  const state = randomBytes(24).toString("base64url");
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = buildCodeChallenge(codeVerifier);
  const authUrl = new URL(GOOGLE_AUTH_BASE_URL);

  authUrl.searchParams.set("client_id", requireEnv(appEnv.googleClientId, "GOOGLE_CLIENT_ID"));
  authUrl.searchParams.set("redirect_uri", getGoogleCallbackUrl(request));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "select_account");

  return {
    state,
    codeVerifier,
    authUrl: authUrl.toString(),
  };
}

export function getGoogleOauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE_SECONDS,
  };
}

export function clearGoogleOauthCookies(response: NextResponse) {
  for (const name of [GOOGLE_OAUTH_STATE_COOKIE_NAME, GOOGLE_OAUTH_CODE_VERIFIER_COOKIE_NAME]) {
    response.cookies.set({
      name,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0),
      maxAge: 0,
    });
  }
}

export function validateGoogleOauthState(expectedState: string | null | undefined, actualState: string | null | undefined) {
  if (!expectedState || !actualState) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedState);
  const actualBuffer = Buffer.from(actualState);

  return (
    expectedBuffer.length === actualBuffer.length &&
    timingSafeEqual(expectedBuffer, actualBuffer)
  );
}

export async function exchangeGoogleCode(options: {
  request: Request;
  code: string;
  codeVerifier: string;
}) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: requireEnv(appEnv.googleClientId, "GOOGLE_CLIENT_ID"),
      client_secret: requireEnv(appEnv.googleClientSecret, "GOOGLE_CLIENT_SECRET"),
      code: options.code,
      code_verifier: options.codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: getGoogleCallbackUrl(options.request),
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as GoogleTokenResponse | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error("google_token_exchange_failed");
  }

  return payload;
}

export async function fetchGoogleUserProfile(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as GoogleUserProfile | null;
  if (!response.ok || !payload?.sub || !payload?.email) {
    throw new Error("google_userinfo_failed");
  }

  return payload;
}

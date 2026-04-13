import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { isNeonAuthConfigured } from "@/lib/env";

const neonMiddleware = isNeonAuthConfigured()
  ? auth?.middleware({ loginUrl: "/auth/sign-in" })
  : null;

export default function middleware(request: NextRequest) {
  if (!neonMiddleware) {
    return NextResponse.next();
  }

  return neonMiddleware(request);
}

export const config = {
  matcher: [
    "/risk-check/:path*",
    "/deals/:path*",
    "/analytics/:path*",
    "/extraction-review/:path*",
    "/proposal-pack/:path*",
    "/account/:path*",
    "/api/risk-check",
    "/api/proposal-pack/:path*",
    "/api/extraction-review/:path*",
    "/api/change-order/:path*",
    "/api/deals/:path*",
    "/api/events",
    "/api/export-blocker",
    "/api/billing/:path*",
  ],
};

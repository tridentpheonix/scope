import { NextResponse, type NextRequest } from "next/server";

export default function middleware(_request: NextRequest) {
  void _request;
  return NextResponse.next();
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
  ],
};

import { NextResponse } from "next/server";
import { getSystemHealthSnapshot } from "@/lib/system-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getSystemHealthSnapshot();
  const status = snapshot.ok ? 200 : 503;

  return NextResponse.json(snapshot, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

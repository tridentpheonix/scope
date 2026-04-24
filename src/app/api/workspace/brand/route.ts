import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { readWorkspaceBrandSettings, saveWorkspaceBrandSettings } from "@/lib/workspace-settings";
import { readJsonBody } from "@/lib/request-body";

export async function GET() {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const settings = await readWorkspaceBrandSettings(authContext.workspace.id);
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(request: Request) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await readJsonBody<unknown>(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, message: "Brand settings payload is invalid." }, { status: 400 });
  }

  const input = body as Record<string, string>;
  const settings = await saveWorkspaceBrandSettings(authContext.workspace.id, {
    brandName: input.brandName,
    logoUrl: input.logoUrl,
    primaryColor: input.primaryColor,
    accentColor: input.accentColor,
    exportFooter: input.exportFooter,
  });

  return NextResponse.json({ ok: true, settings });
}

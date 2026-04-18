import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import { deleteClientMaterial } from "@/lib/deal-deletion";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      void recordDiagnostic("warn", "deals", "deal_delete_unauthorized", {
        route: "/api/deals/[id]",
        message: "Unauthorized deal delete attempt.",
      });
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const result = await deleteClientMaterial(id, undefined, authContext.workspace?.id);

    if (!result.ok) {
      void recordDiagnostic("warn", "deals", "deal_delete_not_found", {
        route: "/api/deals/[id]",
        workspaceId: authContext.workspace?.id,
        submissionId: id,
        message: result.message,
      });
      return NextResponse.json(
        {
          ok: false,
          message: result.message,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: result.message,
      },
      { status: 200 },
    );
  } catch (error) {
    void recordDiagnostic("error", "deals", "deal_delete_failed", {
      route: "/api/deals/[id]",
      workspaceId: undefined,
      submissionId: id,
      message: "Deal deletion failed.",
      error,
    });
    console.error("deal_delete_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not delete this deal right now.",
      },
      { status: 500 },
    );
  }
}

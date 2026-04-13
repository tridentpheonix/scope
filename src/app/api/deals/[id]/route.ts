import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { deleteClientMaterial } from "@/lib/deal-deletion";

export const runtime = "nodejs";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteProps) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const result = await deleteClientMaterial(id, undefined, authContext.workspace?.id);

    if (!result.ok) {
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

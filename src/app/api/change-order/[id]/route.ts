import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import {
  normalizeChangeOrderDraft,
  type ChangeOrderDraft,
} from "@/lib/change-order";
import {
  readChangeOrderRecord,
  saveChangeOrderRecord,
} from "@/lib/change-order-storage";

export const runtime = "nodejs";

type ChangeOrderBody = {
  draft?: ChangeOrderDraft;
};

function isValidStringList(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.length <= 2000)
  );
}

function isValidDraft(value: unknown): value is ChangeOrderDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const draft = value as Record<string, unknown>;

  return (
    isValidStringList(draft.driftItems) &&
    typeof draft.impactNotes === "string" &&
    draft.impactNotes.length <= 6000
  );
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const record = await readChangeOrderRecord(id, undefined, authContext.workspace?.id);

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    console.error("change_order_read_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not load the saved change-order draft.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteProps) {
  try {
    const authContext = await getCurrentWorkspaceContextOrNull();
    if (!authContext?.user) {
      return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as ChangeOrderBody;

    if (!isValidDraft(body.draft)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Change-order payload is invalid.",
        },
        { status: 400 },
      );
    }

    const record = await saveChangeOrderRecord(
      id,
      normalizeChangeOrderDraft(body.draft),
      {
        workspaceId: authContext.workspace?.id ?? undefined,
      },
    );
    console.info("change_order_saved", {
      submissionId: id,
      driftCount: record.draft.driftItems.length,
    });

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    console.error("change_order_save_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not save the change-order draft.",
      },
      { status: 500 },
    );
  }
}

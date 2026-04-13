import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { readProposalPackRecord, saveProposalPackRecord } from "@/lib/proposal-pack-storage";

export const runtime = "nodejs";

type ProposalPackBody = {
  clientBlocks?: Record<string, string>;
};

function isValidClientBlocks(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (item) => typeof item === "string" && item.length <= 20000,
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
    const record = await readProposalPackRecord(id, undefined, authContext.workspace?.id);

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    console.error("proposal_pack_read_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not load the saved proposal pack draft.",
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
    const body = (await request.json()) as ProposalPackBody;

    if (!isValidClientBlocks(body.clientBlocks)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Proposal pack save payload is invalid.",
        },
        { status: 400 },
      );
    }

    const record = await saveProposalPackRecord(id, body.clientBlocks, {
      workspaceId: authContext.workspace?.id ?? undefined,
    });
    console.info("proposal_pack_saved", {
      submissionId: id,
      blockCount: Object.keys(body.clientBlocks).length,
    });

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    console.error("proposal_pack_save_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not save the proposal pack draft.",
      },
      { status: 500 },
    );
  }
}

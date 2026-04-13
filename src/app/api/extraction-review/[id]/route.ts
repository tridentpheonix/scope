import { NextResponse } from "next/server";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import {
  normalizeExtractionReviewDraft,
  type ExtractionReviewDraft,
} from "@/lib/extraction-review";
import {
  readExtractionReviewRecord,
  saveExtractionReviewRecord,
} from "@/lib/extraction-review-storage";

export const runtime = "nodejs";

type ExtractionReviewBody = {
  review?: ExtractionReviewDraft;
};

function isValidStringList(value: unknown) {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.length <= 2000)
  );
}

function isValidExtractionReview(value: unknown): value is ExtractionReviewDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const review = value as Record<string, unknown>;

  return (
    typeof review.summary === "string" &&
    review.summary.length <= 6000 &&
    typeof review.pricingApproach === "string" &&
    review.pricingApproach.length <= 6000 &&
    isValidStringList(review.missingInfoQuestions) &&
    isValidStringList(review.riskFlags) &&
    isValidStringList(review.assumptions)
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
    const record = await readExtractionReviewRecord(id, undefined, authContext.workspace?.id);

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    console.error("extraction_review_read_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not load the saved extraction review.",
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
    const body = (await request.json()) as ExtractionReviewBody;

    if (!isValidExtractionReview(body.review)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Extraction review payload is invalid.",
        },
        { status: 400 },
      );
    }

    const record = await saveExtractionReviewRecord(
      id,
      normalizeExtractionReviewDraft(body.review),
      {
        workspaceId: authContext.workspace?.id ?? undefined,
      },
    );
    console.info("extraction_review_saved", {
      submissionId: id,
      questionCount: record.review.missingInfoQuestions.length,
      riskCount: record.review.riskFlags.length,
    });

    return NextResponse.json({ ok: true, record }, { status: 200 });
  } catch (error) {
    console.error("extraction_review_save_failed", error);
    return NextResponse.json(
      {
        ok: false,
        message: "We could not save the extraction review.",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentWorkspaceContextOrNull } from "@/lib/auth/server";
import { markOnboardingStep, onboardingStepIds, readWorkspaceOnboarding, saveWorkspaceOnboarding } from "@/lib/workspace-onboarding";
import { readJsonBody } from "@/lib/request-body";

const onboardingSchema = z.object({
  completedSteps: z.array(z.enum(onboardingStepIds)).optional(),
  dismissedAt: z.string().nullable().optional(),
});

const markSchema = z.object({
  step: z.enum(onboardingStepIds),
});

export async function GET() {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const record = await readWorkspaceOnboarding(authContext.workspace.id);
  return NextResponse.json({ ok: true, record });
}

export async function PUT(request: Request) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Onboarding payload is invalid." }, { status: 400 });
  }

  const record = await saveWorkspaceOnboarding(authContext.workspace.id, parsed.data);
  return NextResponse.json({ ok: true, record });
}

export async function POST(request: Request) {
  const authContext = await getCurrentWorkspaceContextOrNull();
  if (!authContext?.user || !authContext.workspace?.id) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = await readJsonBody<unknown>(request);
  const parsed = markSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Onboarding step is invalid." }, { status: 400 });
  }

  const record = await markOnboardingStep(authContext.workspace.id, parsed.data.step);
  return NextResponse.json({ ok: true, record });
}

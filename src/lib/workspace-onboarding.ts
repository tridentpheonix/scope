import { isMongoConfigured } from "./env";
import { ensureMongoIndexes, getMongoCollection } from "./mongo";

export const onboardingStepIds = [
  "create-risk-check",
  "review-extraction",
  "generate-proposal-pack",
  "try-branded-export",
  "visit-account",
  "submit-feedback",
] as const;

export type OnboardingStepId = (typeof onboardingStepIds)[number];

export type WorkspaceOnboardingRecord = {
  workspaceId: string;
  completedSteps: OnboardingStepId[];
  dismissedAt: string | null;
  updatedAt: string;
};

type WorkspaceOnboardingDocument = WorkspaceOnboardingRecord & { _id: string };
const fallbackRecords = new Map<string, WorkspaceOnboardingRecord>();

function normalizeSteps(steps: unknown): OnboardingStepId[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  const allowed = new Set<string>(onboardingStepIds);
  return Array.from(
    new Set(steps.filter((step): step is OnboardingStepId => allowed.has(step))),
  );
}

export async function readWorkspaceOnboarding(workspaceId: string) {
  if (isMongoConfigured()) {
    await ensureMongoIndexes();
    const collection =
      await getMongoCollection<WorkspaceOnboardingDocument>("workspace_onboarding");
    const row = await collection.findOne({ _id: workspaceId });
    if (row) {
      return {
        workspaceId: row.workspaceId,
        completedSteps: normalizeSteps(row.completedSteps),
        dismissedAt: row.dismissedAt ?? null,
        updatedAt: row.updatedAt,
      } satisfies WorkspaceOnboardingRecord;
    }
  }

  return (
    fallbackRecords.get(workspaceId) ?? {
      workspaceId,
      completedSteps: [],
      dismissedAt: null,
      updatedAt: new Date(0).toISOString(),
    }
  );
}

export async function saveWorkspaceOnboarding(
  workspaceId: string,
  updates: Partial<Pick<WorkspaceOnboardingRecord, "completedSteps" | "dismissedAt">>,
) {
  const current = await readWorkspaceOnboarding(workspaceId);
  const record = {
    workspaceId,
    completedSteps: normalizeSteps(updates.completedSteps ?? current.completedSteps),
    dismissedAt:
      typeof updates.dismissedAt === "undefined"
        ? current.dismissedAt
        : updates.dismissedAt,
    updatedAt: new Date().toISOString(),
  } satisfies WorkspaceOnboardingRecord;

  if (isMongoConfigured()) {
    await ensureMongoIndexes();
    const collection =
      await getMongoCollection<WorkspaceOnboardingDocument>("workspace_onboarding");
    await collection.updateOne(
      { _id: workspaceId },
      { $set: { _id: workspaceId, ...record } },
      { upsert: true },
    );
  } else {
    fallbackRecords.set(workspaceId, record);
  }

  return record;
}

export async function markOnboardingStep(workspaceId: string, step: OnboardingStepId) {
  const current = await readWorkspaceOnboarding(workspaceId);
  return saveWorkspaceOnboarding(workspaceId, {
    completedSteps: Array.from(new Set([...current.completedSteps, step])),
  });
}

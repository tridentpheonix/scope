export type ScopePlanKey = "free" | "solo" | "team";

export function isPaidPlan(planKey: ScopePlanKey | null | undefined) {
  return planKey === "solo" || planKey === "team";
}

export function canUseBrandedExport(planKey: ScopePlanKey | null | undefined) {
  return isPaidPlan(planKey);
}

export function canAccessSavedHistory(planKey: ScopePlanKey | null | undefined) {
  return isPaidPlan(planKey);
}

export function canAccessAnalytics(planKey: ScopePlanKey | null | undefined) {
  return isPaidPlan(planKey);
}

export function getPlanLabel(planKey: ScopePlanKey | null | undefined) {
  if (planKey === "solo") {
    return "Solo";
  }

  if (planKey === "team") {
    return "Team";
  }

  return "Free";
}


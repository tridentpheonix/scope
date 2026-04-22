import { redirect } from "next/navigation";
import { getCurrentWorkspaceContext, getCurrentWorkspaceContextOrNull } from "./auth/server";
import { isOpsAccessConfigured, isOpsOperatorEmail } from "./env";

export function canAccessOpsDashboard(email: string) {
  return isOpsAccessConfigured() && isOpsOperatorEmail(email);
}

export async function getCurrentOperatorContext() {
  const context = await getCurrentWorkspaceContext();

  if (!canAccessOpsDashboard(context.user.email)) {
    redirect("/account?ops=denied");
  }

  return context;
}

export async function getCurrentOperatorContextOrNull() {
  const context = await getCurrentWorkspaceContextOrNull();

  if (!context || !canAccessOpsDashboard(context.user.email)) {
    return null;
  }

  return context;
}

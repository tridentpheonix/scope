import { NextResponse } from "next/server";
import { recordDiagnostic } from "@/lib/diagnostics";
import { isAlertingConfigured, isObservabilityConfigured } from "@/lib/env";
import { getCurrentOperatorContextOrNull } from "@/lib/operator-access";

export const runtime = "nodejs";

export async function POST() {
  const authContext = await getCurrentOperatorContextOrNull();

  if (!authContext?.user) {
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const alertingConfigured = isAlertingConfigured();
  const observabilityConfigured = isObservabilityConfigured();

  const diagnostic = await recordDiagnostic("error", "maintenance", "ops_alert_self_test", {
    route: "/api/ops/alert-test",
    workspaceId: authContext.workspace?.id,
    message: "Operator requested an alert delivery self-test.",
    details: {
      operatorEmail: authContext.user.email,
      alertingConfigured,
      observabilityConfigured,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      message: alertingConfigured
        ? "Alert self-test recorded. Check the external alert destination and the /ops incident list."
        : "Alert self-test recorded locally. External alert delivery is not configured yet.",
      alertingConfigured,
      observabilityConfigured,
      diagnostic: {
        at: diagnostic.at,
        event: diagnostic.event,
        area: diagnostic.area,
        level: diagnostic.level,
      },
    },
    { status: 200 },
  );
}

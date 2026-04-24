"use client";

import { useState } from "react";

type AlertTestState =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "sending";
      message: string;
    }
  | {
      status: "success" | "error";
      message: string;
      alertingConfigured?: boolean;
      observabilityConfigured?: boolean;
    };

export function OpsAlertTest() {
  const [state, setState] = useState<AlertTestState>({
    status: "idle",
    message: "Use this after adding alert webhook env vars to confirm delivery end to end.",
  });

  async function sendAlertTest() {
    setState({
      status: "sending",
      message: "Sending alert self-test...",
    });

    try {
      const response = await fetch("/api/ops/alert-test", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            message?: string;
            alertingConfigured?: boolean;
            observabilityConfigured?: boolean;
          }
        | null;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.message ?? "Alert self-test failed.");
      }

      setState({
        status: "success",
        message: payload.message ?? "Alert self-test recorded.",
        alertingConfigured: payload.alertingConfigured,
        observabilityConfigured: payload.observabilityConfigured,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Alert self-test failed.",
      });
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700">
      <strong className="block text-base text-slate-950">Alert delivery self-test</strong>
      <p className="m-0 mt-2">
        This creates an operator-only test diagnostic. If external alerting is configured, it should also reach the alert destination.
      </p>
      <button
        type="button"
        className="btn btn-small btn-dark mt-4"
        disabled={state.status === "sending"}
        onClick={sendAlertTest}
      >
        {state.status === "sending" ? "Sending..." : "Send alert test"}
      </button>
      <div
        className={`mt-4 rounded-2xl border px-4 py-3 ${
          state.status === "error"
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-slate-200 bg-white text-slate-600"
        }`}
      >
        {state.message}
        {state.status === "success" ? (
          <div className="mt-2 text-xs">
            Alerting: {state.alertingConfigured ? "configured" : "not configured"} · Observability:{" "}
            {state.observabilityConfigured ? "configured" : "not configured"}
          </div>
        ) : null}
      </div>
    </div>
  );
}

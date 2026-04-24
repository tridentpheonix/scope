"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptInvitationForm({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function accept() {
    setStatus(null);
    setIsBusy(true);
    try {
      const response = await fetch("/api/workspace/team/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Could not accept invite.");
      }
      router.replace("/account?team=joined");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not accept invite.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <p className="m-0 text-sm leading-7 text-slate-700">
        Accept this invite to join the shared ScopeOS workspace with your signed-in account.
      </p>
      {status ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-900">
          {status}
        </div>
      ) : null}
      <button type="button" className="btn btn-dark w-fit" disabled={isBusy} onClick={() => void accept()}>
        {isBusy ? "Joining..." : "Accept workspace invite"}
      </button>
    </div>
  );
}

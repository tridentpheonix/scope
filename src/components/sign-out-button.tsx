"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignOutButton() {
  return <SignOutButtonInner />;
}

type SignOutButtonInnerProps = {
  className?: string;
  label?: string;
};

export function SignOutButtonInner({
  className,
  label = "Sign out",
}: SignOutButtonInnerProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSignOut() {
    setStatus(null);
    setIsBusy(true);
    let upstreamSucceeded = false;

    try {
      await authClient.signOut({
        fetchOptions: {
          throw: true,
        },
      });
      upstreamSucceeded = true;
    } catch (error) {
      console.error("auth_sign_out_failed", error);
    }

    const fallbackResponse = await fetch("/api/auth/local-sign-out", {
      method: "POST",
      cache: "no-store",
    }).catch(() => null);

    if (!fallbackResponse?.ok && !upstreamSucceeded) {
      setStatus("Could not sign out right now. Please retry.");
      setIsBusy(false);
      return;
    }

    window.location.replace("/?signed_out=1");
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleSignOut}
        className={`btn btn-outline ${className ?? ""}`.trim()}
        disabled={isBusy}
      >
        {isBusy ? "Signing out..." : label}
      </button>
      {status ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {status}
        </div>
      ) : null}
    </div>
  );
}


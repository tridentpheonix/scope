"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }
    setIsBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Could not reset password.");
      }
      router.replace("/auth/sign-in?password=changed");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        New password
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Confirm new password
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Re-type the new password"
          autoComplete="new-password"
        />
      </label>
      {status ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-7 text-rose-900">
          {status}
        </div>
      ) : null}
      <button type="submit" className="btn btn-dark w-fit" disabled={isBusy}>
        {isBusy ? "Resetting..." : "Reset password"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function PasswordChangeForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (newPassword !== confirmPassword) {
      setStatus("New passwords do not match.");
      return;
    }

    setIsBusy(true);

    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        fetchOptions: {
          throw: true,
        },
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.replace("/auth/sign-in?password=changed");
      router.refresh();
      setStatus("Password changed. Please sign in again.");
    } catch (error) {
      console.error("password_change_failed", error);
      setStatus(
        error instanceof Error
          ? error.message
          : "Could not change your password right now.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Current password
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>

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

      <p className="m-0 text-sm leading-7 text-slate-600">
        Changing your password signs you out of every session so you can sign in again with the new password.
      </p>

      {status ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {status}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-dark" disabled={isBusy}>
          {isBusy ? "Updating..." : "Change password"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsBusy(true);
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Could not request password reset.");
      }
      setStatus(payload.message ?? "If an account exists, a reset link will be sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not request password reset.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Account email
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@agency.com"
          autoComplete="email"
        />
      </label>
      {status ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
          {status}
        </div>
      ) : null}
      <button type="submit" className="btn btn-dark w-fit" disabled={isBusy}>
        {isBusy ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}

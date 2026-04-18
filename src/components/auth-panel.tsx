"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

type Mode = "sign-in" | "sign-up";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const panelTitle = useMemo(
    () => (mode === "sign-in" ? "Sign in to ScopeOS" : "Create your ScopeOS account"),
    [mode],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsBusy(true);

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
          callbackURL: "/risk-check",
          fetchOptions: {
            throw: true,
          },
        });

        if (!("token" in result) || !result.token) {
          setMode("sign-in");
          setStatus("Account created. Sign in to continue.");
          setIsBusy(false);
          return;
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/risk-check",
          fetchOptions: {
            throw: true,
          },
        });
      }

      router.push("/risk-check");
      router.refresh();
    } catch (error) {
      console.error("auth_submit_failed", error);
      setStatus(
        mode === "sign-in"
          ? "Could not sign you in. Check your credentials and try again."
          : "Could not create your account. Please retry.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleGoogle() {
    setStatus(null);
    setIsBusy(true);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/risk-check",
      });
    } catch (error) {
      console.error("auth_google_failed", error);
      setStatus("Google sign-in could not start. Please retry.");
      setIsBusy(false);
    }
  }

  return (
    <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="grid gap-3">
        <span className="eyebrow">Authentication</span>
        <h1
          className="m-0 text-3xl font-semibold tracking-[-0.04em] text-slate-950 md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {panelTitle}
        </h1>
        <p className="m-0 text-sm leading-7 text-slate-600">
          ScopeOS now stores workspace data in Neon and uses Stripe for billing. Sign in to create
          and manage your agency workspace.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`btn btn-small ${
            mode === "sign-in"
              ? "btn-dark"
              : "btn-outline bg-white"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`btn btn-small ${
            mode === "sign-up"
              ? "btn-dark"
              : "btn-outline bg-white"
          }`}
        >
          Create account
        </button>
      </div>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        {mode === "sign-up" ? (
          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Name
            <input
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Satya"
            />
          </label>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Email
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="hello@agency.com"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Password
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </label>

        {status ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {status}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="btn btn-dark"
            disabled={isBusy}
          >
            {isBusy
              ? "Working..."
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
          <button
            type="button"
            onClick={handleGoogle}
            className="btn btn-outline"
            disabled={isBusy}
          >
            Continue with Google
          </button>
        </div>
      </form>
    </div>
  );
}

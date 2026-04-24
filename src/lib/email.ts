import { appEnv } from "./env";

export function isEmailConfigured() {
  return Boolean(appEnv.resendApiKey && appEnv.resendFromEmail);
}

export async function sendTransactionalEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}) {
  if (!appEnv.resendApiKey || !appEnv.resendFromEmail) {
    return {
      ok: false as const,
      skipped: true as const,
      reason: "Resend is not configured.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${appEnv.resendApiKey}`,
      "Content-Type": "application/json",
      ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: appEnv.resendFromEmail,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; message?: string }
    | null;

  if (!response.ok) {
    return {
      ok: false as const,
      skipped: false as const,
      reason: payload?.message ?? `Resend returned ${response.status}.`,
    };
  }

  return {
    ok: true as const,
    id: payload?.id ?? null,
  };
}

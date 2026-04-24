/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("node:crypto");

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function signStripePayload(payload, secret, timestamp) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

function buildSmokeEvent(eventId) {
  const created = Math.floor(Date.now() / 1000);

  return {
    id: eventId,
    object: "event",
    api_version: "2026-02-25.clover",
    created,
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: "req_scopeos_smoke",
      idempotency_key: null,
    },
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_scopeos_smoke",
        object: "subscription",
        customer: "cus_scopeos_smoke",
        status: "active",
        metadata: {
          planKey: "solo",
          priceId: "price_scopeos_smoke",
        },
        items: {
          object: "list",
          data: [
            {
              id: "si_scopeos_smoke",
              object: "subscription_item",
              price: {
                id: "price_scopeos_smoke",
                object: "price",
              },
            },
          ],
        },
      },
    },
  };
}

async function postWebhook(url, secret, payload) {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Stripe-Signature": signStripePayload(body, secret, timestamp),
    },
    body,
  });

  const responseBody = await response.json().catch(() => null);
  return {
    status: response.status,
    ok: response.ok,
    body: responseBody,
  };
}

async function main() {
  const baseUrl = readEnv("SMOKE_BASE_URL") ?? "https://scope-wheat.vercel.app";
  const secret = readEnv("LIVE_STRIPE_WEBHOOK_SECRET") ?? readEnv("STRIPE_WEBHOOK_SECRET");

  if (!secret) {
    throw new Error("Set LIVE_STRIPE_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET before running the webhook replay smoke.");
  }

  const eventId = readEnv("STRIPE_WEBHOOK_SMOKE_EVENT_ID") ?? `evt_scopeos_smoke_${Date.now()}`;
  const webhookUrl = new URL("/api/stripe/webhook", baseUrl).toString();
  const event = buildSmokeEvent(eventId);

  const first = await postWebhook(webhookUrl, secret, event);
  const replay = await postWebhook(webhookUrl, secret, event);

  const passed =
    first.status === 200 &&
    first.body?.ok === true &&
    replay.status === 200 &&
    replay.body?.ok === true &&
    replay.body?.duplicate === true;

  console.log(
    JSON.stringify(
      {
        ok: passed,
        baseUrl,
        eventId,
        first: {
          status: first.status,
          ok: first.body?.ok === true,
          duplicate: first.body?.duplicate === true,
        },
        replay: {
          status: replay.status,
          ok: replay.body?.ok === true,
          duplicate: replay.body?.duplicate === true,
        },
      },
      null,
      2,
    ),
  );

  if (!passed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error?.message ?? String(error) }, null, 2));
  process.exit(1);
});

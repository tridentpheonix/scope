export type AnalyticsEvent = {
  name: string;
  submissionId?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type AnalyticsPayload = Omit<AnalyticsEvent, "createdAt"> & {
  createdAt?: string;
};

export async function trackEvent(payload: AnalyticsPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const body: AnalyticsEvent = {
    ...payload,
    createdAt: payload.createdAt ?? new Date().toISOString(),
  };

  try {
    await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      keepalive: true,
    });
  } catch (error) {
    console.error("analytics_event_failed", error);
  }
}

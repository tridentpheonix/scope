export type ChangeOrderDraft = {
  driftItems: string[];
  impactNotes: string;
};

function unique(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

export function normalizeChangeOrderDraft(draft: ChangeOrderDraft) {
  return {
    driftItems: unique(draft.driftItems),
    impactNotes: draft.impactNotes.trim(),
  } satisfies ChangeOrderDraft;
}

export function buildChangeOrderSummary(draft: ChangeOrderDraft) {
  const normalized = normalizeChangeOrderDraft(draft);

  if (normalized.driftItems.length === 0) {
    return [
      "No scope drift items have been captured yet.",
      "",
      "Add drift items to generate a draft change-order note for the client.",
    ].join("\n");
  }

  return [
    "The following items fall outside the approved scope and should be treated as a change order:",
    "",
    ...normalized.driftItems.map((item) => `- ${item}`),
    "",
    normalized.impactNotes
      ? `Impact notes: ${normalized.impactNotes}`
      : "Impact notes: Confirm timeline and pricing impact before responding.",
  ].join("\n");
}

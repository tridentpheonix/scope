"use client";

import { useState } from "react";

type DealDeleteButtonProps = {
  submissionId: string;
  onDeleted?: () => void;
};

export function DealDeleteButton({
  submissionId,
  onDeleted,
}: DealDeleteButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete all client materials for this deal? This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/deals/${submissionId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { ok: boolean; message: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Delete failed.");
      }

      setStatus("Client materials deleted.");
      if (onDeleted) {
        onDeleted();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("deal_delete_failed", error);
      setStatus("Delete failed. Please retry.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleDelete}
        className="btn btn-destructive"
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete client material"}
      </button>
      {status ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {status}
        </div>
      ) : null}
    </div>
  );
}

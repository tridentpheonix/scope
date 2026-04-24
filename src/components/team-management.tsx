"use client";

import { useState } from "react";
import type { TeamMember, WorkspaceInvitation, WorkspaceRole } from "@/lib/workspace-team";

export function TeamManagement({
  initialMembers,
  initialInvitations,
  canManage,
}: {
  initialMembers: TeamMember[];
  initialInvitations: WorkspaceInvitation[];
  canManage: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<WorkspaceRole, "owner">>("member");
  const [status, setStatus] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function refreshTeam() {
    const response = await fetch("/api/workspace/team");
    const payload = (await response.json()) as {
      ok?: boolean;
      members?: TeamMember[];
      invitations?: WorkspaceInvitation[];
    };
    if (payload.ok && payload.members && payload.invitations) {
      setMembers(payload.members);
      setInvitations(payload.invitations);
    }
  }

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setIsBusy(true);
    try {
      const response = await fetch("/api/workspace/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; acceptUrl?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Could not send invite.");
      }
      setEmail("");
      setStatus(payload.acceptUrl ? `Invite created. Email sent if Resend is configured. Manual link: ${payload.acceptUrl}` : "Invite created.");
      await refreshTeam();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create invite.");
    } finally {
      setIsBusy(false);
    }
  }

  async function updateRole(userId: string, nextRole: WorkspaceRole) {
    setStatus(null);
    const response = await fetch(`/api/workspace/team/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const payload = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !payload.ok) {
      setStatus(payload.message ?? "Could not update role.");
      return;
    }
    await refreshTeam();
  }

  async function removeMember(userId: string) {
    setStatus(null);
    const response = await fetch(`/api/workspace/team/members/${userId}`, { method: "DELETE" });
    const payload = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !payload.ok) {
      setStatus(payload.message ?? "Could not remove member.");
      return;
    }
    await refreshTeam();
  }

  async function revokeInvite(invitationId: string) {
    setStatus(null);
    const response = await fetch(`/api/workspace/team/invitations/${invitationId}`, { method: "DELETE" });
    const payload = (await response.json()) as { ok?: boolean; message?: string };
    if (!response.ok || !payload.ok) {
      setStatus(payload.message ?? "Could not revoke invite.");
      return;
    }
    await refreshTeam();
  }

  return (
    <div className="grid gap-5">
      <form className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4" onSubmit={invite}>
        <div className="text-sm leading-7 text-slate-700">
          {canManage
            ? "Invite teammates into this workspace. Admins can manage team settings; members can use the workspace."
            : "You can view this team, but only owners/admins can invite or manage members."}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_150px_auto]">
          <input
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@agency.com"
            disabled={!canManage}
          />
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950"
            value={role}
            onChange={(event) => setRole(event.target.value as Exclude<WorkspaceRole, "owner">)}
            disabled={!canManage}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn btn-dark" disabled={!canManage || isBusy}>
            {isBusy ? "Inviting..." : "Invite"}
          </button>
        </div>
      </form>

      {status ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
          {status}
        </div>
      ) : null}

      <div className="grid gap-3">
        {members.map((member) => (
          <div key={member.userId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div>
              <div className="font-semibold text-slate-950">{member.name ?? member.email}</div>
              <div className="text-sm text-slate-600">{member.email}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                value={member.role}
                onChange={(event) => void updateRole(member.userId, event.target.value as WorkspaceRole)}
                disabled={!canManage}
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
              <button
                type="button"
                className="btn btn-small btn-outline"
                onClick={() => void removeMember(member.userId)}
                disabled={!canManage}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {invitations.length ? (
        <div className="grid gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Pending invites
          </div>
          {invitations.map((invite) => (
            <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <span>{invite.email} · {invite.role}</span>
              <button type="button" className="font-semibold underline" onClick={() => void revokeInvite(invite.id)} disabled={!canManage}>
                Revoke
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

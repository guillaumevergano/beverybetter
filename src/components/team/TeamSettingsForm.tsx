"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { InviteLinkCopier } from "./InviteLinkCopier";
import { TeamMemberActions } from "./TeamMemberActions";
import {
  updateTeamAction,
  regenerateInviteCodeAction,
  disbandTeamAction,
  kickMemberAction,
  transferOwnershipAction,
  leaveTeamAction,
} from "@/actions/team";
import { useAuth } from "@/hooks/useAuth";
import { TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH } from "@/lib/constants";
import type { Team, TeamMemberStats, TeamRole } from "@/types";

interface TeamSettingsFormProps {
  team: Team;
  role: TeamRole;
  members: TeamMemberStats[];
}

export function TeamSettingsForm({ team, role, members }: TeamSettingsFormProps) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description);
  const [inviteCode, setInviteCode] = useState(team.invite_code);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [disbanding, setDisbanding] = useState(false);
  const [confirmDisband, setConfirmDisband] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const router = useRouter();
  const { refreshTeam } = useAuth();

  const isOwner = role === "owner";

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    const result = await updateTeamAction(name, description || undefined);
    if (!result.success) {
      setError(result.error ?? "Erreur");
    } else {
      setSuccess("Equipe mise a jour");
      await refreshTeam();
      setTimeout(() => setSuccess(""), 3000);
    }
    setSaving(false);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const result = await regenerateInviteCodeAction();
    if (result.success && result.data) {
      setInviteCode(result.data);
      await refreshTeam();
    }
    setRegenerating(false);
  }

  async function handleDisband() {
    setDisbanding(true);
    const result = await disbandTeamAction();
    if (result.success) {
      await refreshTeam();
      router.push("/team");
      router.refresh();
    } else {
      setError(result.error ?? "Erreur");
    }
    setDisbanding(false);
  }

  async function handleLeave() {
    setLeaving(true);
    const result = await leaveTeamAction();
    if (result.success) {
      await refreshTeam();
      router.push("/team");
      router.refresh();
    } else {
      setError(result.error ?? "Erreur");
    }
    setLeaving(false);
  }

  async function handleKick(userId: string) {
    const result = await kickMemberAction(userId);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Erreur");
    }
  }

  async function handleTransfer(userId: string) {
    const result = await transferOwnershipAction(userId);
    if (result.success) {
      await refreshTeam();
      router.refresh();
    } else {
      setError(result.error ?? "Erreur");
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm px-4 py-3 rounded-[12px]">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#f0fdf4] border border-[#bbf7d0] text-[#065f46] text-sm px-4 py-3 rounded-[12px]">
          {success}
        </div>
      )}

      {/* Lien d'invitation */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-5">
        <h3 className="text-sm font-bold text-[#0f172a] mb-3">Lien d&apos;invitation</h3>
        <InviteLinkCopier inviteCode={inviteCode} />
        <p className="text-xs text-[#94a3b8] mt-2">
          Code : <span className="font-mono font-bold">{inviteCode}</span>
        </p>
        {isOwner && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="text-xs text-[#0070f3] font-medium mt-2 hover:underline disabled:opacity-50"
          >
            {regenerating ? "Regeneration..." : "Regenerer le code"}
          </button>
        )}
      </div>

      {/* Modifier equipe (owner only) */}
      {isOwner && (
        <form onSubmit={handleSave} className="bg-white rounded-[20px] border border-[#e2e8f0] p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#0f172a]">Modifier l&apos;equipe</h3>
          <div>
            <label htmlFor="settings-name" className="block text-xs font-medium text-[#0f172a] mb-1">
              Nom
            </label>
            <input
              id="settings-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={TEAM_NAME_MIN_LENGTH}
              maxLength={TEAM_NAME_MAX_LENGTH}
              className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="settings-desc" className="block text-xs font-medium text-[#0f172a] mb-1">
              Description
            </label>
            <textarea
              id="settings-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full px-3 py-2 rounded-[8px] border border-[#e2e8f0] text-sm focus:outline-none focus:ring-2 focus:ring-[#0070f3] focus:border-transparent resize-none"
            />
          </div>
          <Button type="submit" loading={saving} size="sm">
            Enregistrer
          </Button>
        </form>
      )}

      {/* Membres */}
      {isOwner && (
        <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-5">
          <h3 className="text-sm font-bold text-[#0f172a] mb-3">
            Membres ({members.length})
          </h3>
          <div className="divide-y divide-[#f1f5f9]">
            {members.map((member) => (
              <div key={member.user_id} className="flex items-center gap-3 py-2">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-xs font-bold">
                    {member.pseudo.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0f172a] truncate">
                    {member.pseudo}
                    {member.role === "owner" && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-[#fef3c7] text-[#92400e] rounded-full font-medium">
                        Chef
                      </span>
                    )}
                  </p>
                </div>
                {member.role !== "owner" && (
                  <TeamMemberActions
                    userId={member.user_id}
                    pseudo={member.pseudo}
                    onKick={handleKick}
                    onTransfer={handleTransfer}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone danger */}
      <div className="bg-white rounded-[20px] border border-[#fecaca] p-5">
        <h3 className="text-sm font-bold text-[#991b1b] mb-3">Zone de danger</h3>
        {isOwner ? (
          <>
            {!confirmDisband ? (
              <button
                onClick={() => setConfirmDisband(true)}
                className="text-sm text-[#ef4444] font-medium hover:underline"
              >
                Dissoudre l&apos;equipe
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#991b1b]">Confirmer la dissolution ?</span>
                <Button variant="danger" size="sm" loading={disbanding} onClick={handleDisband}>
                  Dissoudre
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDisband(false)}>
                  Annuler
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            {!confirmLeave ? (
              <button
                onClick={() => setConfirmLeave(true)}
                className="text-sm text-[#ef4444] font-medium hover:underline"
              >
                Quitter l&apos;equipe
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#991b1b]">Confirmer ?</span>
                <Button variant="danger" size="sm" loading={leaving} onClick={handleLeave}>
                  Quitter
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(false)}>
                  Annuler
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getTeamMembersAction, getMyTeamAction } from "@/actions/team";
import { TeamEmptyState } from "@/components/team/TeamEmptyState";
import { TeamLeaderboard } from "@/components/team/TeamLeaderboard";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { InviteLinkCopier } from "@/components/team/InviteLinkCopier";
import { Spinner } from "@/components/ui/Spinner";
import type { Team, TeamMemberStats, TeamRole } from "@/types";

export default function TeamPage() {
  const { user, team: teamInfo } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [role, setRole] = useState<TeamRole | null>(null);
  const [members, setMembers] = useState<TeamMemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [teamRes, membersRes] = await Promise.all([
        getMyTeamAction(),
        getTeamMembersAction(),
      ]);

      if (teamRes.success && teamRes.data) {
        setTeam(teamRes.data.team);
        setRole(teamRes.data.role);
      }
      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data);
      }
      setLoading(false);
    }

    if (teamInfo) {
      load();
    } else {
      setLoading(false);
    }
  }, [teamInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!team || !teamInfo) {
    return <TeamEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header equipe */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {team.name}
          </h1>
          {team.description && (
            <p className="text-sm text-[#64748b] mt-1">{team.description}</p>
          )}
          <p className="text-xs text-[#94a3b8] mt-1">
            {members.length} membre{members.length !== 1 ? "s" : ""} &middot; {team.max_members} max
          </p>
        </div>
        <Link
          href="/team/settings"
          className="px-4 py-2 text-sm font-medium rounded-[12px] bg-white border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f1f5f9] transition-all"
        >
          {role === "owner" ? "Gerer" : "Parametres"}
        </Link>
      </div>

      {/* Invite link */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-5">
        <h3 className="text-sm font-bold text-[#0f172a] mb-3">Inviter des membres</h3>
        <InviteLinkCopier inviteCode={team.invite_code} />
      </div>

      {/* Leaderboard */}
      {user && <TeamLeaderboard members={members} currentUserId={user.id} />}

      {/* Grille membres */}
      <div>
        <h3
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Tous les membres
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => (
            <TeamMemberCard
              key={member.user_id}
              member={member}
              isMe={member.user_id === user?.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getMyTeamAction, getTeamMembersAction } from "@/actions/team";
import { TeamSettingsForm } from "@/components/team/TeamSettingsForm";
import { Spinner } from "@/components/ui/Spinner";
import type { Team, TeamMemberStats, TeamRole } from "@/types";

export default function TeamSettingsPage() {
  const { team: teamInfo } = useAuth();
  const router = useRouter();
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
      } else {
        router.push("/team");
        return;
      }
      if (membersRes.success && membersRes.data) {
        setMembers(membersRes.data);
      }
      setLoading(false);
    }

    if (teamInfo) {
      load();
    } else {
      router.push("/team");
    }
  }, [teamInfo, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!team || !role) return null;

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/team"
        className="inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Retour
      </Link>

      <h1
        className="text-2xl font-bold text-[#0f172a] mb-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {role === "owner" ? "Gerer l'equipe" : "Parametres"}
      </h1>

      <TeamSettingsForm team={team} role={role} members={members} />
    </div>
  );
}

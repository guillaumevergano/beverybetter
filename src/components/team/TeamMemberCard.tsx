"use client";

import type { TeamMemberStats } from "@/types";
import { formatXP } from "@/lib/utils";

interface TeamMemberCardProps {
  member: TeamMemberStats;
  isMe: boolean;
}

export function TeamMemberCard({ member, isMe }: TeamMemberCardProps) {
  return (
    <div className={`bg-white rounded-[20px] border ${isMe ? "border-[#0070f3]" : "border-[#e2e8f0]"} p-5`}>
      <div className="flex items-center gap-3 mb-4">
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt=""
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-lg font-bold">
            {member.pseudo.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0f172a] truncate">
            {member.pseudo}
            {isMe && <span className="text-[#64748b] text-xs ml-1">(toi)</span>}
          </p>
          <p className="text-xs text-[#64748b]">
            Niv. {member.current_level} &middot; {member.current_title}
          </p>
        </div>
        {member.role === "owner" && (
          <span className="text-[10px] px-2 py-0.5 bg-[#fef3c7] text-[#92400e] rounded-full font-medium">
            Chef
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatItem label="XP Total" value={formatXP(member.xp_total)} />
        <StatItem label="Streak" value={`${member.current_streak}j`} />
        <StatItem label="Cours termines" value={String(member.courses_completed)} />
        <StatItem label="Badges" value={String(member.badges_count)} />
        <StatItem label="Certifications" value={String(member.certifications_count)} />
        <StatItem label="Record streak" value={`${member.longest_streak}j`} />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f8fafc] rounded-[8px] px-3 py-2">
      <p className="text-[10px] text-[#94a3b8] font-medium uppercase">{label}</p>
      <p className="text-sm font-bold text-[#0f172a]">{value}</p>
    </div>
  );
}

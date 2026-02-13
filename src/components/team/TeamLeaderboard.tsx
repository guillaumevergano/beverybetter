"use client";

import type { TeamMemberStats } from "@/types";
import { formatXP } from "@/lib/utils";

interface TeamLeaderboardProps {
  members: TeamMemberStats[];
  currentUserId: string;
}

function getRankDisplay(rank: number): string {
  if (rank === 1) return "1er";
  return `${rank}e`;
}

export function TeamLeaderboard({ members, currentUserId }: TeamLeaderboardProps) {
  return (
    <div className="bg-white rounded-[20px] border border-[#e2e8f0] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e2e8f0]">
        <h3
          className="text-lg font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Classement
        </h3>
      </div>
      <div className="divide-y divide-[#f1f5f9]">
        {members.map((member, index) => {
          const isMe = member.user_id === currentUserId;
          const rank = index + 1;

          return (
            <div
              key={member.user_id}
              className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-[#eff6ff]" : ""}`}
            >
              <span className={`text-sm font-bold w-8 text-center ${rank <= 3 ? "text-[#0070f3]" : "text-[#94a3b8]"}`}>
                {getRankDisplay(rank)}
              </span>
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0070f3] flex items-center justify-center text-white text-xs font-bold">
                  {member.pseudo.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0f172a] truncate">
                  {member.pseudo}
                  {isMe && <span className="text-[#64748b] text-xs ml-1">(toi)</span>}
                  {member.role === "owner" && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-[#fef3c7] text-[#92400e] rounded-full font-medium">
                      Chef
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#64748b]">
                  Niv. {member.current_level} &middot; {member.current_title}
                </p>
              </div>
              <div className="text-right flex items-center gap-3">
                {member.current_streak > 0 && (
                  <span className="text-xs text-[#f97316] font-medium">
                    {member.current_streak}j
                  </span>
                )}
                <span className="text-sm font-bold text-[#0070f3]">
                  {formatXP(member.xp_total)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

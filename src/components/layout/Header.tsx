"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/components/gamification/GamificationProvider";
import { UserMenu } from "./UserMenu";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakBadge } from "@/components/gamification/StreakBadge";

export function Header() {
  const { profile, team, loading } = useAuth();
  const { stats } = useGamification();

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a] border-b border-[#1e293b]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white font-bold text-lg"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <span className="text-[#0070f3] text-2xl">B</span>
          <span className="hidden sm:inline">Be Very Better</span>
          <span className="sm:hidden">BVB</span>
        </Link>

        <div className="flex items-center gap-3">
          {!loading && profile && (
            <>
              <XPBar
                totalXp={stats?.xp_total ?? profile.xp_total}
                level={stats?.current_level ?? profile.current_level}
                title={stats?.current_title ?? profile.current_title}
              />
              <StreakBadge
                currentStreak={stats?.streak?.current_streak ?? 0}
                streakFreezes={stats?.streak?.freeze_count ?? 0}
              />
              {team && (
                <Link
                  href="/team"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1e293b] hover:bg-[#334155] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <span className="text-xs font-medium text-[#e2e8f0] max-w-[80px] truncate">
                    {team.name}
                  </span>
                </Link>
              )}
              <UserMenu profile={profile} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

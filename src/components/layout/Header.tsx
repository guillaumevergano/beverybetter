"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/components/gamification/GamificationProvider";
import { UserMenu } from "./UserMenu";
import { XPBar } from "@/components/gamification/XPBar";
import { StreakBadge } from "@/components/gamification/StreakBadge";

export function Header() {
  const { profile, loading } = useAuth();
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
              <UserMenu profile={profile} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

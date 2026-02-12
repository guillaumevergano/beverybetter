"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "./UserMenu";
import { formatXP } from "@/lib/utils";

export function Header() {
  const { profile, loading } = useAuth();

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

        <div className="flex items-center gap-4">
          {!loading && profile && (
            <>
              <span className="hidden md:inline text-xs text-[#94a3b8] bg-[#1e293b] px-3 py-1 rounded-full">
                {formatXP(profile.xp_total)}
              </span>
              <UserMenu profile={profile} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

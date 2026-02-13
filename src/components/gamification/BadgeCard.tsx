"use client";

import { useState } from "react";
import type { Badge } from "@/types";

interface BadgeCardProps {
  badge: Badge;
  unlocked: boolean;
  unlockedAt?: string;
}

const RARITY_STYLES = {
  common: { border: "#10b981", bg: "#f0fdf4" },
  rare: { border: "#3b82f6", bg: "#eff6ff" },
  epic: { border: "#8b5cf6", bg: "#f5f3ff" },
  legendary: { border: "#eab308", bg: "#fefce8" },
} as const;

const DEFAULT_STYLE = RARITY_STYLES.common;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BadgeCard({ badge, unlocked, unlockedAt }: BadgeCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const style = RARITY_STYLES[badge.rarity] ?? DEFAULT_STYLE;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
          unlocked
            ? "bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5"
            : "bg-[#f8fafc] opacity-60"
        } ${badge.rarity === "legendary" && unlocked ? "animate-shimmer" : ""}`}
        style={{
          borderColor: unlocked ? style.border : "#e2e8f0",
        }}
      >
        {/* Icon */}
        <div
          className="text-3xl"
          style={{
            filter: unlocked ? "none" : "grayscale(1)",
          }}
        >
          {unlocked ? badge.icon : "❓"}
        </div>

        {/* Name */}
        <p
          className={`text-xs font-semibold text-center leading-tight ${
            unlocked ? "text-[#0f172a]" : "text-[#94a3b8]"
          }`}
        >
          {badge.name}
        </p>

        {/* Rarity dot */}
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: unlocked ? style.border : "#cbd5e1" }}
        />

        {/* Unlock date */}
        {unlocked && unlockedAt && (
          <p className="text-[10px] text-[#94a3b8]">
            {formatDate(unlockedAt)}
          </p>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#0f172a] rounded-xl shadow-lg z-50 animate-fade-in min-w-[180px] max-w-[220px]">
          <p className="text-xs font-semibold text-white">{badge.name}</p>
          <p className="text-[10px] text-[#94a3b8] mt-0.5">
            {badge.description}
          </p>
          <p className="text-[10px] text-[#64748b] mt-1 capitalize">
            {badge.rarity} {badge.xp_reward > 0 && `\u00B7 +${badge.xp_reward} XP`}
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0f172a] rotate-45" />
        </div>
      )}
    </div>
  );
}

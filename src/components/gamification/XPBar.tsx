"use client";

import { getLevelProgress } from "@/lib/gamification";
import { formatXP } from "@/lib/utils";

interface XPBarProps {
  totalXp: number;
  level: number;
  title: string;
}

export function XPBar({ totalXp, level, title }: XPBarProps) {
  const levelInfo = getLevelProgress(totalXp);
  const xpInLevel = totalXp - levelInfo.minXP;
  const xpNeeded = levelInfo.maxXP - levelInfo.minXP;
  const progressPercent = Math.round(levelInfo.progress * 100);

  return (
    <div className="flex items-center gap-2.5">
      {/* Level badge */}
      <div className="relative shrink-0 w-8 h-8 rounded-full bg-[#0070f3] flex items-center justify-center">
        <span
          className="text-xs font-bold text-white"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {level}
        </span>
        {progressPercent === 100 && (
          <div className="absolute inset-0 rounded-full animate-xp-flash" />
        )}
      </div>

      {/* Progress section */}
      <div className="hidden sm:flex flex-col gap-0.5 min-w-[120px]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-[#e2e8f0]">
            {title}
          </span>
          <span className="text-[10px] text-[#94a3b8]">
            {xpNeeded > 0
              ? `${formatXP(xpInLevel)} / ${formatXP(xpNeeded)}`
              : "MAX"}
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-[#0070f3] transition-all duration-700 ease-out ${
              progressPercent === 100 ? "animate-xp-bar-flash" : ""
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Mobile: compact XP display */}
      <span className="sm:hidden text-[10px] font-semibold text-[#94a3b8]">
        {formatXP(totalXp)}
      </span>
    </div>
  );
}

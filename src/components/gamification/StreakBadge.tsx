"use client";

import { useState } from "react";

interface StreakBadgeProps {
  currentStreak: number;
  streakFreezes: number;
}

function getFlameColor(streak: number): string {
  if (streak >= 100) return "#eab308";
  if (streak >= 30) return "#3b82f6";
  if (streak >= 7) return "#ef4444";
  if (streak >= 1) return "#f97316";
  return "#94a3b8";
}

export function StreakBadge({ currentStreak, streakFreezes }: StreakBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = getFlameColor(currentStreak);

  return (
    <div
      className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-[#1e293b] cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-sm" style={{ filter: currentStreak === 0 ? "grayscale(1)" : "none" }}>
        🔥
      </span>
      <span className="text-xs font-bold" style={{ color }}>
        {currentStreak}
      </span>

      {streakFreezes > 0 && (
        <span className="flex items-center gap-0.5 text-[10px] text-[#94a3b8]">
          <span>❄️</span>
          <span>{streakFreezes}</span>
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-lg whitespace-nowrap z-50 animate-fade-in">
          <span className="text-xs text-[#e2e8f0]">
            Streak : {currentStreak} jour{currentStreak !== 1 ? "s" : ""} cons&eacute;cutif{currentStreak !== 1 ? "s" : ""}
          </span>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0f172a] border-l border-t border-[#1e293b] rotate-45" />
        </div>
      )}
    </div>
  );
}

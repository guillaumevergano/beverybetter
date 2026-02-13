"use client";

import type { Challenge } from "@/types";

interface ChallengeCardProps {
  challenge: Challenge;
  userProgress: number;
  completed: boolean;
}

function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function ChallengeCard({
  challenge,
  userProgress,
  completed,
}: ChallengeCardProps) {
  const daysLeft = getDaysRemaining(challenge.end_date);
  const progressPercent = Math.min(
    Math.round((userProgress / challenge.condition_value) * 100),
    100
  );
  const isWeekly = challenge.type === "weekly";

  return (
    <div
      className={`relative p-5 rounded-2xl border-2 transition-all ${
        completed
          ? "bg-[#f0fdf4] border-[#10b981]"
          : "bg-white border-[#e2e8f0] hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Type badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
            isWeekly
              ? "bg-[#eff6ff] text-[#3b82f6]"
              : "bg-[#f5f3ff] text-[#8b5cf6]"
          }`}
        >
          {isWeekly ? "Hebdo" : "Mensuel"}
        </span>

        {completed ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-[#10b981]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Terminé
          </span>
        ) : (
          <span className="text-[10px] text-[#94a3b8]">
            {daysLeft > 0 ? `${daysLeft}j restant${daysLeft > 1 ? "s" : ""}` : "Expiré"}
          </span>
        )}
      </div>

      {/* Title + description */}
      <h4
        className={`text-sm font-bold mb-1 ${
          completed ? "text-[#065f46]" : "text-[#0f172a]"
        }`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {challenge.title}
      </h4>
      <p className="text-xs text-[#64748b] mb-4">{challenge.description}</p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-[#64748b]">
            {userProgress} / {challenge.condition_value}
          </span>
          <span className="text-[10px] font-bold text-[#64748b]">
            {progressPercent}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: completed ? "#10b981" : "#0070f3",
            }}
          />
        </div>
      </div>

      {/* XP reward */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs">⚡</span>
        <span className="text-xs font-semibold text-[#0070f3]">
          +{challenge.xp_reward} XP
        </span>
      </div>
    </div>
  );
}

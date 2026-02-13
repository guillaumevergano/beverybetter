"use client";

import { useEffect, useState } from "react";
import type { GamificationEvent } from "@/types";

interface XPToastProps {
  event: GamificationEvent;
  onDone: () => void;
}

export function XPToast({ event, onDone }: XPToastProps) {
  const [visible, setVisible] = useState(true);

  const duration =
    event.type === "level_up" ? 5000 : event.type === "badge" ? 4000 : 3000;

  useEffect(() => {
    const fadeTimer = setTimeout(() => setVisible(false), duration - 500);
    const removeTimer = setTimeout(onDone, duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onDone]);

  return (
    <div
      className={`pointer-events-none transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      }`}
    >
      {event.type === "xp" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-[#e2e8f0] shadow-lg">
          <span className="text-lg">⚡</span>
          <span
            className="text-sm font-bold text-[#0070f3]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            +{event.amount} XP
          </span>
        </div>
      )}

      {event.type === "level_up" && (
        <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-lg">
          <span className="text-2xl">🎉</span>
          <div>
            <p
              className="text-sm font-bold text-[#0f172a]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Niveau {event.new_level} !
            </p>
            <p className="text-xs text-[#64748b]">{event.new_title}</p>
          </div>
        </div>
      )}

      {event.type === "badge" && event.badge && (
        <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-lg">
          <span className="text-2xl">{event.badge.icon}</span>
          <div>
            <p
              className="text-sm font-bold text-[#0f172a]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {event.badge.name}
            </p>
            <p className="text-xs text-[#64748b] capitalize">
              {event.badge.rarity}
            </p>
          </div>
        </div>
      )}

      {event.type === "streak" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-2xl border border-[#e2e8f0] shadow-lg">
          <span className="text-lg">🔥</span>
          <span className="text-sm font-bold text-[#f97316]">
            {event.streak_days} jour{(event.streak_days ?? 0) > 1 ? "s" : ""} de streak !
          </span>
        </div>
      )}
    </div>
  );
}

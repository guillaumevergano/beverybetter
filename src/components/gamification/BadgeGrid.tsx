"use client";

import type { Badge, BadgeRarity } from "@/types";
import { BadgeCard } from "./BadgeCard";

interface BadgeWithUnlock extends Badge {
  unlockedAt?: string;
}

interface BadgeGridProps {
  badges: BadgeWithUnlock[];
}

const RARITY_ORDER: BadgeRarity[] = ["legendary", "epic", "rare", "common"];

const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
};

const RARITY_COLORS: Record<BadgeRarity, string> = {
  common: "#10b981",
  rare: "#3b82f6",
  epic: "#8b5cf6",
  legendary: "#eab308",
};

export function BadgeGrid({ badges }: BadgeGridProps) {
  const grouped = RARITY_ORDER.map((rarity) => {
    const items = badges.filter((b) => b.rarity === rarity);
    const unlocked = items.filter((b) => b.unlockedAt).length;
    return { rarity, items, unlocked, total: items.length };
  }).filter((g) => g.total > 0);

  return (
    <div className="space-y-8">
      {grouped.map(({ rarity, items, unlocked, total }) => (
        <div key={rarity}>
          {/* Section header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: RARITY_COLORS[rarity] }}
            />
            <h3
              className="text-sm font-bold text-[#0f172a]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {RARITY_LABELS[rarity]}
            </h3>
            <span className="text-xs text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">
              {unlocked}/{total}
            </span>
          </div>

          {/* Badge grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {items.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                unlocked={!!badge.unlockedAt}
                unlockedAt={badge.unlockedAt}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

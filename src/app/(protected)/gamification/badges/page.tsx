import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Badge, UserBadge, BadgeRarity } from "@/types";

const RARITY_ORDER: BadgeRarity[] = ["legendary", "epic", "rare", "common"];

const RARITY_LABELS: Record<BadgeRarity, { label: string; color: string }> = {
  legendary: { label: "Légendaire", color: "#eab308" },
  epic: { label: "Épique", color: "#8b5cf6" },
  rare: { label: "Rare", color: "#3b82f6" },
  common: { label: "Commun", color: "#10b981" },
};

const CONDITION_LABELS: Record<string, string> = {
  courses_completed: "Terminer {n} cours",
  quizzes_completed: "Compléter {n} QCM",
  perfect_quizzes: "Obtenir {n} score(s) parfait(s)",
  streak_days: "Maintenir un streak de {n} jour(s)",
  technologies_started: "Commencer {n} technologie(s)",
  all_technologies: "Commencer toutes les technologies",
  level_reached: "Atteindre le niveau {n}",
  night_study: "Étudier {n} nuit(s) (00h-05h)",
  comeback_days: "Revenir après {n}+ jours d'absence",
  techno_courses_complete: "Terminer tous les cours d'une techno",
  techno_all_perfect: "Score parfait sur tous les QCM d'une techno",
  daily_courses: "Compléter {n} cours en une journée",
  redemption_perfect: "Score parfait après {n}+ échecs au même QCM",
  early_adopter: "Être parmi les {n} premiers inscrits",
  speed_perfect: "QCM parfait en moins de 60 secondes",
};

function getConditionText(type: string, value: number): string {
  const template = CONDITION_LABELS[type] ?? `${type} ≥ ${value}`;
  return template.replace("{n}", String(value));
}

export default async function BadgesDetailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: allBadgesData }, { data: userBadgesData }] = await Promise.all([
    supabase.from("badges").select("*").order("rarity"),
    supabase.from("user_badges").select("badge_id, unlocked_at").eq("user_id", user!.id),
  ]);

  const allBadges = (allBadgesData ?? []) as Badge[];
  const userBadgesMap = new Map(
    ((userBadgesData ?? []) as UserBadge[]).map((ub) => [ub.badge_id, ub])
  );

  const unlockedCount = userBadgesMap.size;
  const totalCount = allBadges.length;

  // Group by rarity
  const grouped = new Map<BadgeRarity, Badge[]>();
  for (const badge of allBadges) {
    const group = grouped.get(badge.rarity) ?? [];
    group.push(badge);
    grouped.set(badge.rarity, group);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl">🏅</div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Badges
        </h1>
        <p className="text-[#64748b]">
          {unlockedCount} / {totalCount} débloqués
        </p>
        {/* Progress bar */}
        <div className="w-48 mx-auto h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#0070f3] transition-all"
            style={{ width: `${totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Badges by rarity */}
      {RARITY_ORDER.map((rarity) => {
        const badges = grouped.get(rarity);
        if (!badges || badges.length === 0) return null;
        const info = RARITY_LABELS[rarity];
        const unlockedInGroup = badges.filter((b) => userBadgesMap.has(b.id)).length;

        return (
          <div key={rarity} className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: info.color }}
              />
              <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {info.label}
              </h2>
              <span className="text-xs font-semibold text-[#94a3b8]">
                {unlockedInGroup}/{badges.length}
              </span>
            </div>

            <div className="space-y-4">
              {badges.map((badge) => {
                const userBadge = userBadgesMap.get(badge.id);
                const isUnlocked = !!userBadge;

                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      isUnlocked
                        ? "border-l-4 bg-white"
                        : "border-[#e2e8f0] bg-[#f8fafc]"
                    }`}
                    style={{
                      borderLeftColor: isUnlocked ? info.color : undefined,
                      borderColor: isUnlocked ? info.color : undefined,
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="text-3xl shrink-0"
                      style={{ filter: isUnlocked ? "none" : "grayscale(1) opacity(0.4)" }}
                    >
                      {badge.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isUnlocked ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
                        {badge.name}
                      </p>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {badge.description}
                      </p>
                      <p className="text-[10px] text-[#94a3b8] mt-1">
                        Condition : {getConditionText(badge.condition_type, badge.condition_value)}
                      </p>
                    </div>

                    {/* Right side */}
                    <div className="shrink-0 text-right">
                      {isUnlocked ? (
                        <>
                          <span className="text-sm font-bold text-[#10b981]">✓</span>
                          {userBadge.unlocked_at && (
                            <p className="text-[10px] text-[#94a3b8] mt-0.5">
                              {new Date(userBadge.unlocked_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-[#0070f3]">
                          +{badge.xp_reward} XP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

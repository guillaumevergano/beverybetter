import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { XP_REWARDS } from "@/lib/gamification";
import type { StreakInfo } from "@/types";

export default async function StreaksDetailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: streakData } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  const streak = streakData as StreakInfo | null;
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;
  const freezes = streak?.freeze_count ?? 0;
  const lastActivity = streak?.last_activity_date;

  const milestones = [
    { days: 7, label: "Semaine de Feu", icon: "🔥", xp: XP_REWARDS.streak_7, badge: "streak_7" },
    { days: 30, label: "Flamme Éternelle", icon: "🌟", xp: XP_REWARDS.streak_30, badge: "streak_30" },
    { days: 100, label: "Légende Vivante", icon: "🏆", xp: XP_REWARDS.streak_100, badge: "streak_100" },
  ];

  function getFlameColor(s: number): string {
    if (s >= 100) return "#eab308";
    if (s >= 30) return "#3b82f6";
    if (s >= 7) return "#ef4444";
    if (s >= 1) return "#f97316";
    return "#94a3b8";
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
        <div className="text-5xl">🔥</div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Streak
        </h1>
        <p className="text-[#64748b]">
          Maintiens ton activité quotidienne pour débloquer des bonus.
        </p>
      </div>

      {/* Current streak display */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-8 text-center">
        <div
          className="text-6xl font-bold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: getFlameColor(currentStreak) }}
        >
          {currentStreak}
        </div>
        <p className="text-lg text-[#64748b] mt-1">
          jour{currentStreak !== 1 ? "s" : ""} consécutif{currentStreak !== 1 ? "s" : ""}
        </p>

        <div className="flex justify-center gap-8 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {longestStreak}
            </p>
            <p className="text-xs text-[#94a3b8]">Record</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {freezes}
            </p>
            <p className="text-xs text-[#94a3b8]">❄️ Freezes</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0f172a]">
              {lastActivity
                ? new Date(lastActivity).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                : "—"}
            </p>
            <p className="text-xs text-[#94a3b8]">Dernière activité</p>
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Paliers
        </h2>
        <div className="space-y-4">
          {milestones.map((m) => {
            const reached = currentStreak >= m.days;
            const progressPct = Math.min(Math.round((currentStreak / m.days) * 100), 100);

            return (
              <div
                key={m.days}
                className={`p-4 rounded-2xl border-2 ${
                  reached ? "border-[#10b981] bg-[#f0fdf4]" : "border-[#e2e8f0] bg-white"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{m.icon}</span>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${reached ? "text-[#065f46]" : "text-[#0f172a]"}`}>
                      {m.label} — {m.days} jours
                    </p>
                    <p className="text-xs text-[#64748b]">
                      Récompense : +{m.xp} XP + badge
                    </p>
                  </div>
                  {reached ? (
                    <span className="text-sm font-bold text-[#10b981]">✓</span>
                  ) : (
                    <span className="text-xs font-semibold text-[#94a3b8]">
                      {currentStreak}/{m.days}
                    </span>
                  )}
                </div>
                {!reached && (
                  <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progressPct}%`, backgroundColor: getFlameColor(currentStreak) }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Comment ça marche
        </h2>
        <div className="space-y-3">
          {[
            { icon: "📖", text: "Complète un cours ou un QCM chaque jour pour maintenir ton streak." },
            { icon: "❄️", text: "Les freezes sauvegardent ton streak si tu manques un jour (max 1 jour d'absence)." },
            { icon: "✖️", text: "Si tu manques 2 jours ou plus sans freeze, le streak repasse à 0." },
            { icon: "⚡", text: "Multiplicateur XP : x1.5 à partir de 7 jours, x2.0 à partir de 30 jours." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#f8fafc]">
              <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
              <p className="text-sm text-[#0f172a]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

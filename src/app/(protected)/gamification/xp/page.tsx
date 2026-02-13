import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEVELS, getLevelProgress, XP_REWARDS } from "@/lib/gamification";
import { formatXP } from "@/lib/utils";
import type { XPEvent } from "@/types";

export default async function XPDetailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: xpEventsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp_total, current_level, current_title")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("xp_events")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const xpTotal = (profile?.xp_total as number) ?? 0;
  const levelInfo = getLevelProgress(xpTotal);
  const xpEvents = (xpEventsData ?? []) as XPEvent[];

  const SOURCE_LABELS: Record<string, { label: string; icon: string }> = {
    course: { label: "Cours terminé", icon: "📖" },
    quiz: { label: "QCM complété", icon: "✏️" },
    badge: { label: "Badge débloqué", icon: "🏅" },
    streak: { label: "Bonus streak", icon: "🔥" },
    challenge: { label: "Défi complété", icon: "🎯" },
    certification: { label: "Certification", icon: "🎓" },
  };

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
        <div className="text-4xl">⚡</div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Expérience (XP)
        </h1>
        <p className="text-[#64748b]">
          {formatXP(xpTotal)} au total — Niveau {levelInfo.level} ({levelInfo.title})
        </p>
      </div>

      {/* Current level progress */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-[#0070f3] flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {levelInfo.level}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#0f172a]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {levelInfo.title}
            </p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-[#64748b]">
                {formatXP(levelInfo.currentXP - levelInfo.minXP)} / {formatXP(levelInfo.maxXP - levelInfo.minXP)}
              </span>
              <span className="text-xs font-bold text-[#0070f3]">
                {Math.round(levelInfo.progress * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#e2e8f0] rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-[#0070f3] transition-all"
                style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* All levels */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Tous les niveaux
        </h2>
        <div className="space-y-3">
          {LEVELS.map((lvl, i) => {
            const nextLvl = LEVELS[i + 1];
            const isReached = xpTotal >= lvl.minXP;
            const isCurrent = lvl.level === levelInfo.level;

            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-[#0070f3]/5 border-2 border-[#0070f3]/20"
                    : isReached
                      ? "bg-[#f0fdf4]"
                      : "bg-[#f8fafc]"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isReached ? "bg-[#0070f3] text-white" : "bg-[#e2e8f0] text-[#94a3b8]"
                  }`}
                >
                  {lvl.level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isReached ? "text-[#0f172a]" : "text-[#94a3b8]"}`}>
                    {lvl.title}
                  </p>
                  <p className="text-xs text-[#64748b]">
                    {formatXP(lvl.minXP)}{nextLvl ? ` → ${formatXP(nextLvl.minXP)}` : " +"}
                  </p>
                </div>
                {isReached && (
                  <span className="text-xs font-semibold text-[#10b981]">
                    {isCurrent ? "Actuel" : "✓"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* XP rewards reference */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Gains d&apos;XP
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Cours terminé", xp: XP_REWARDS.course_complete, icon: "📖" },
            { label: "QCM complété (base)", xp: XP_REWARDS.quiz_complete, icon: "✏️" },
            { label: "Par bonne réponse", xp: XP_REWARDS.quiz_per_correct, icon: "✅" },
            { label: "Bonus QCM parfait", xp: XP_REWARDS.quiz_perfect_bonus, icon: "🎯" },
            { label: "Streak 7 jours", xp: XP_REWARDS.streak_7, icon: "🔥" },
            { label: "Streak 30 jours", xp: XP_REWARDS.streak_30, icon: "🌟" },
            { label: "Streak 100 jours", xp: XP_REWARDS.streak_100, icon: "🏆" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-[#f8fafc]">
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-sm text-[#0f172a]">{item.label}</span>
              <span className="text-sm font-bold text-[#0070f3]">+{item.xp} XP</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#94a3b8] mt-3">
          Multiplicateur streak : x1.5 (7j+) ou x2.0 (30j+)
        </p>
      </div>

      {/* Recent XP history */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Historique récent
        </h2>
        {xpEvents.length === 0 ? (
          <p className="text-sm text-[#94a3b8] text-center py-4">Aucun événement XP pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {xpEvents.map((event) => {
              const sourceInfo = SOURCE_LABELS[event.source] ?? { label: event.source, icon: "💫" };
              const date = new Date(event.created_at);
              return (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#f8fafc]">
                  <span className="text-lg">{sourceInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#0f172a]">{sourceInfo.label}</p>
                    <p className="text-[10px] text-[#94a3b8]">
                      {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-[#10b981]">+{event.amount} XP</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

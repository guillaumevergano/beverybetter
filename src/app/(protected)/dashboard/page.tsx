import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatXP, calcPercent } from "@/lib/utils";
import { getLevelProgress } from "@/lib/gamification";
import type { Technology, Chapter, UserProgress, StreakInfo, Badge, UserBadge } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: technologies },
    { data: chapters },
    { data: progressData },
    { data: streakData },
    { data: recentBadgesData },
    badgesCountResult,
    { data: certsData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("technologies").select("*").order("display_order"),
    supabase.from("chapters").select("*").order("display_order"),
    supabase.from("user_progress").select("*").eq("user_id", user!.id),
    supabase.from("user_streaks").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase
      .from("user_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", user!.id)
      .order("unlocked_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_badges")
      .select("badge_id", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("user_certifications")
      .select("technology_id")
      .eq("user_id", user!.id),
  ]);

  const progressMap = new Map<string, UserProgress>();
  (progressData as UserProgress[] | null)?.forEach((p) =>
    progressMap.set(p.chapter_id, p)
  );

  const allChapters = (chapters as Chapter[] | null) ?? [];
  const totalChapters = allChapters.length;
  const completedChapters = allChapters.filter(
    (c) => progressMap.get(c.id)?.completed
  ).length;
  const globalPercent = calcPercent(completedChapters, totalChapters);

  const xpTotal = profile?.xp_total ?? 0;
  const levelInfo = getLevelProgress(xpTotal);
  const streak = streakData as StreakInfo | null;
  const recentBadges = (recentBadgesData ?? []) as (UserBadge & { badge: Badge })[];
  const totalBadges = badgesCountResult.count ?? 0;
  const certTechIds = new Set(
    ((certsData ?? []) as Array<{ technology_id: string }>).map((c) => c.technology_id)
  );

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Salut, {profile?.pseudo ?? "Utilisateur"} !
        </h1>
        <p className="text-[#64748b] mt-1">
          Continue ta progression — tu es <strong>{levelInfo.title}</strong> (niveau {levelInfo.level})
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="⚡"
          iconBg="#fef3c7"
          label="XP Total"
          value={formatXP(xpTotal)}
          href="/gamification/xp"
        />
        <StatCard
          icon="🔥"
          iconBg="#fee2e2"
          label="Streak"
          value={`${streak?.current_streak ?? 0} jour${(streak?.current_streak ?? 0) !== 1 ? "s" : ""}`}
          href="/gamification/streaks"
        />
        <StatCard
          icon="🏅"
          iconBg="#ede9fe"
          label="Badges"
          value={`${totalBadges}`}
          href="/gamification/badges"
        />
        <StatCard
          icon="🎓"
          iconBg="#e0f2fe"
          label="Certifications"
          value={`${certTechIds.size}`}
          href="/gamification/certifications"
        />
      </div>

      {/* XP Progress bar */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Level badge */}
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-14 h-14 rounded-full bg-[#0070f3] flex items-center justify-center shrink-0">
              <span
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {levelInfo.level}
              </span>
            </div>
            <div>
              <p
                className="text-lg font-bold text-[#0f172a]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {levelInfo.title}
              </p>
              <p className="text-sm text-[#64748b]">
                {formatXP(xpTotal)} au total
              </p>
            </div>
          </div>

          {/* Level progress bar */}
          <div className="w-full sm:flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-[#64748b]">
                Niveau {levelInfo.level} → {levelInfo.level < 10 ? levelInfo.level + 1 : "MAX"}
              </span>
              <span className="text-xs font-bold text-[#0070f3]">
                {Math.round(levelInfo.progress * 100)}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.round(levelInfo.progress * 100)}%`, backgroundColor: "#0070f3" }}
              />
            </div>
            <p className="text-[10px] text-[#94a3b8] mt-1">
              {formatXP(levelInfo.currentXP - levelInfo.minXP)} / {formatXP(levelInfo.maxXP - levelInfo.minXP)}
            </p>
          </div>
        </div>

        {/* Global chapter progress */}
        <div className="mt-5 pt-5 border-t border-[#f1f5f9]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-[#64748b]">
              Progression globale — {completedChapters}/{totalChapters} chapitres
            </span>
            <span className="text-xs font-bold text-[#10b981]">{globalPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${globalPercent}%`, backgroundColor: "#10b981" }}
            />
          </div>
        </div>
      </div>

      {/* Recent badges */}
      {recentBadges.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-bold text-[#0f172a]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Badges récents
            </h2>
            <Link
              href="/profile"
              className="text-xs font-semibold text-[#0070f3] hover:underline"
            >
              Voir tout →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recentBadges.map((ub) => (
              <div
                key={ub.badge_id}
                className="flex flex-col items-center gap-1.5 min-w-[72px]"
              >
                <div className="text-2xl">{ub.badge.icon}</div>
                <p className="text-[10px] font-semibold text-[#0f172a] text-center leading-tight">
                  {ub.badge.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technology cards */}
      <div>
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Parcours
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(technologies as Technology[] | null)?.map((tech) => {
            const techChapters = (chapters as Chapter[] | null)?.filter(
              (c) => c.tech_id === tech.id
            ) ?? [];
            const completedCount = techChapters.filter(
              (c) => progressMap.get(c.id)?.completed
            ).length;
            const percentage = calcPercent(completedCount, techChapters.length);
            const isCertified = certTechIds.has(tech.id);

            return (
              <Link key={tech.id} href={`/learn/${tech.id}`}>
                <Card hover>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-[16px] flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${tech.color}15` }}
                      >
                        {tech.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className="text-lg font-bold text-[#0f172a]"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                          >
                            {tech.name}
                          </h3>
                          {isCertified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold">
                              🎓 Certifié
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#64748b]">
                          {completedCount}/{techChapters.length} chapitres
                        </p>
                      </div>
                    </div>
                    <ProgressRing
                      percentage={percentage}
                      color={tech.accent}
                    />
                  </div>

                  <div className="mt-4 w-full bg-[#e2e8f0] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: tech.accent,
                      }}
                    />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
  href,
}: {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-[20px] border border-[#e2e8f0] p-4 flex items-center gap-3 group hover:border-[#0070f3]/30 hover:shadow-sm transition-all"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#94a3b8] font-medium">{label}</p>
        <p
          className="text-sm font-bold text-[#0f172a] truncate"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {value}
        </p>
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 group-hover:stroke-[#0070f3] transition-colors"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </Link>
  );
}

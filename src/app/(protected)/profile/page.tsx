import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { getLevelProgress } from "@/lib/gamification";
import { formatXP, calcPercent } from "@/lib/utils";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { ActivityGraph } from "@/components/gamification/ActivityGraph";
import { ChallengeCard } from "@/components/gamification/ChallengeCard";
import type {
  Profile,
  Technology,
  Chapter,
  UserProgress,
  Badge,
  UserBadge,
  Challenge,
  UserChallenge,
  UserCertification,
  StreakInfo,
} from "@/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parallel data fetch
  const [
    { data: profile },
    { data: technologies },
    { data: chapters },
    { data: progressData },
    { data: streakData },
    { data: allBadges },
    { data: userBadges },
    { data: certsData },
    { data: challengesData },
    { data: userChallengesData },
    { data: xpEventsData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("technologies").select("*").order("display_order"),
    supabase.from("chapters").select("*").order("display_order"),
    supabase.from("user_progress").select("*").eq("user_id", user!.id),
    supabase.from("user_streaks").select("*").eq("user_id", user!.id).maybeSingle(),
    supabase.from("badges").select("*").order("rarity"),
    supabase.from("user_badges").select("*").eq("user_id", user!.id),
    supabase.from("user_certifications").select("*").eq("user_id", user!.id),
    supabase.from("challenges").select("*").lte("start_date", new Date().toISOString().split("T")[0] as string).gte("end_date", new Date().toISOString().split("T")[0] as string),
    supabase.from("user_challenges").select("*").eq("user_id", user!.id),
    supabase.from("xp_events").select("amount, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(500),
  ]);

  const p = profile as Profile;
  const techs = (technologies ?? []) as Technology[];
  const allChapters = (chapters ?? []) as Chapter[];
  const progress = (progressData ?? []) as UserProgress[];
  const streak = streakData as StreakInfo | null;
  const certs = (certsData ?? []) as UserCertification[];
  const challenges = (challengesData ?? []) as Challenge[];
  const userChallenges = (userChallengesData ?? []) as UserChallenge[];

  const progressMap = new Map(progress.map((pr) => [pr.chapter_id, pr]));
  const levelInfo = getLevelProgress(p.xp_total);

  // Badge grid data
  const unlockedMap = new Map(
    ((userBadges ?? []) as UserBadge[]).map((ub) => [ub.badge_id, ub.unlocked_at])
  );
  const badgesWithUnlock = ((allBadges ?? []) as Badge[]).map((b) => ({
    ...b,
    unlockedAt: unlockedMap.get(b.id),
  }));

  // Activity graph data (last 90 days)
  const activityMap = new Map<string, { count: number; xp: number }>();
  for (const ev of (xpEventsData ?? []) as { amount: number; created_at: string }[]) {
    const date = ev.created_at.split("T")[0] as string;
    const existing = activityMap.get(date) ?? { count: 0, xp: 0 };
    activityMap.set(date, { count: existing.count + 1, xp: existing.xp + ev.amount });
  }
  const activityData = Array.from(activityMap.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    xp: data.xp,
  }));

  // Challenge progress map
  const challengeProgressMap = new Map(userChallenges.map((uc) => [uc.challenge_id, uc]));

  // Certifications map
  const certMap = new Map(certs.map((c) => [c.technology_id, c]));

  // Stats
  const completedCourses = progress.filter((pr) => pr.completed).length;
  const completedQuizzes = progress.filter((pr) => pr.best_score !== null).length;
  const bestStreak = streak?.longest_streak ?? 0;

  const memberSince = new Date(p.created_at).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-[#0070f3] flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {p.pseudo.charAt(0).toUpperCase()}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h1
              className="text-2xl font-bold text-[#0f172a]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {p.pseudo}
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              ⚡ {p.current_title} — Niveau {p.current_level}
            </p>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Membre depuis {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="⚡" label="Total XP" value={formatXP(p.xp_total)} />
        <StatCard icon="📖" label="Cours terminés" value={String(completedCourses)} />
        <StatCard icon="✅" label="QCM réussis" value={String(completedQuizzes)} />
        <StatCard icon="🔥" label="Meilleur streak" value={`${bestStreak}j`} />
      </div>

      {/* XP bar large */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#0f172a]">
            Niveau {levelInfo.level} — {levelInfo.title}
          </span>
          <span className="text-xs text-[#64748b]">
            {levelInfo.maxXP > levelInfo.minXP
              ? `${formatXP(p.xp_total - levelInfo.minXP)} / ${formatXP(levelInfo.maxXP - levelInfo.minXP)}`
              : "MAX"}
          </span>
        </div>
        <div className="w-full h-3 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 bg-[#0070f3]"
            style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
          />
        </div>
      </Card>

      {/* Activity graph */}
      <Card>
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Activité
        </h2>
        <ActivityGraph activityData={activityData} />
      </Card>

      {/* Badges */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-lg font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Badges
          </h2>
          <span className="text-xs text-[#94a3b8] bg-[#f1f5f9] px-2.5 py-1 rounded-full">
            {unlockedMap.size}/{(allBadges ?? []).length}
          </span>
        </div>
        <BadgeGrid badges={badgesWithUnlock} />
      </Card>

      {/* Technologies progress + Certifications */}
      <Card>
        <h2
          className="text-lg font-bold text-[#0f172a] mb-4"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Technologies
        </h2>
        <div className="space-y-6">
          {techs.map((tech) => {
            const techChapters = allChapters.filter((c) => c.tech_id === tech.id);
            const completedCount = techChapters.filter((c) => progressMap.get(c.id)?.completed).length;
            const percentage = calcPercent(completedCount, techChapters.length);

            // Average score
            const scores = techChapters
              .map((c) => progressMap.get(c.id)?.best_score)
              .filter((s): s is number => s !== null && s !== undefined);
            const avgScore = scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 20) // *20 to get %
              : 0;

            const cert = certMap.get(tech.id);
            const allCompleted = completedCount === techChapters.length && techChapters.length > 0;
            const canCertify = allCompleted && avgScore >= 80 && !cert;

            return (
              <div key={tech.id} className="border border-[#e2e8f0] rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${tech.color}15` }}
                  >
                    {tech.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0f172a]">{tech.name}</h3>
                      {cert && (
                        <span className="text-xs font-semibold text-[#10b981] bg-[#f0fdf4] px-2 py-0.5 rounded-full">
                          ✅ Certifié — {cert.mention}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748b]">
                      {completedCount}/{techChapters.length} chapitres · Score moyen : {avgScore}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: tech.accent }}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/learn/${tech.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                  >
                    Voir les chapitres
                  </Link>
                  {canCertify && (
                    <Link
                      href={`/learn/${tech.id}/exam`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: tech.accent }}
                    >
                      Passer la certification
                    </Link>
                  )}
                  {cert && (
                    <Link
                      href={`/api/certificate/${cert.cert_number}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-colors"
                      target="_blank"
                    >
                      Voir le certificat
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Active challenges */}
      {challenges.length > 0 && (
        <Card>
          <h2
            className="text-lg font-bold text-[#0f172a] mb-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Défis en cours
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((ch) => {
              const uc = challengeProgressMap.get(ch.id);
              return (
                <ChallengeCard
                  key={ch.id}
                  challenge={ch}
                  userProgress={uc?.progress ?? 0}
                  completed={uc?.completed ?? false}
                />
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================================
// StatCard sub-component
// ============================================

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <p
        className="text-xl font-bold text-[#0f172a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {value}
      </p>
      <p className="text-xs text-[#64748b] mt-0.5">{label}</p>
    </div>
  );
}

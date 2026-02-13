// ============================================
// Be Very Better — Gamification Engine
// ============================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  GamificationEvent,
  LevelInfo,
  UserStats,
  StreakInfo,
  Badge,
  XPSource,
} from "@/types";

// ============================================
// Constants
// ============================================

export const LEVELS: { level: number; title: string; minXP: number }[] = [
  { level: 1, title: "Curieux", minXP: 0 },
  { level: 2, title: "Apprenti", minXP: 200 },
  { level: 3, title: "Initié", minXP: 500 },
  { level: 4, title: "Pratiquant", minXP: 1000 },
  { level: 5, title: "Confirmé", minXP: 2000 },
  { level: 6, title: "Avancé", minXP: 3500 },
  { level: 7, title: "Expert", minXP: 5500 },
  { level: 8, title: "Maître", minXP: 8000 },
  { level: 9, title: "Sage", minXP: 12000 },
  { level: 10, title: "Légende", minXP: 18000 },
];

export const XP_REWARDS = {
  course_complete: 50,
  quiz_complete: 30,
  quiz_per_correct: 20,
  quiz_perfect_bonus: 100,
  streak_7: 50,
  streak_30: 200,
  streak_100: 500,
  referral: 100,
} as const;

// ============================================
// getLevelProgress
// ============================================

export function getLevelProgress(totalXp: number): LevelInfo {
  const firstLevel = LEVELS[0] ?? { level: 1, title: "Curieux", minXP: 0 };
  let currentLevelData = firstLevel;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const lvl = LEVELS[i];
    if (lvl && totalXp >= lvl.minXP) {
      currentLevelData = lvl;
      break;
    }
  }

  const nextLevel = LEVELS.find((l) => l.level === currentLevelData.level + 1);
  const maxXP = nextLevel ? nextLevel.minXP : currentLevelData.minXP;
  const xpInLevel = totalXp - currentLevelData.minXP;
  const xpNeeded = maxXP - currentLevelData.minXP;
  const progress = xpNeeded > 0 ? Math.min(xpInLevel / xpNeeded, 1) : 1;

  return {
    level: currentLevelData.level,
    title: currentLevelData.title,
    minXP: currentLevelData.minXP,
    maxXP,
    currentXP: totalXp,
    progress,
  };
}

// ============================================
// grantXP
// ============================================

export async function grantXP(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  source: XPSource,
  sourceId?: string
): Promise<GamificationEvent[]> {
  const events: GamificationEvent[] = [];

  if (amount <= 0) return events;

  // Insert XP event
  await supabase.from("xp_events").insert({
    user_id: userId,
    amount,
    source,
    source_id: sourceId ?? null,
  });

  // Get current profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_total, current_level")
    .eq("id", userId)
    .single();

  if (!profile) return events;

  const oldXP = profile.xp_total as number;
  const newXP = oldXP + amount;
  const oldLevel = profile.current_level as number;
  const newLevelInfo = getLevelProgress(newXP);

  // Update profile
  const updatePayload: Record<string, unknown> = { xp_total: newXP };
  if (newLevelInfo.level !== oldLevel) {
    updatePayload.current_level = newLevelInfo.level;
    updatePayload.current_title = newLevelInfo.title;
  }

  await supabase.from("profiles").update(updatePayload).eq("id", userId);

  events.push({ type: "xp", amount });

  // Check level up
  if (newLevelInfo.level > oldLevel) {
    events.push({
      type: "level_up",
      new_level: newLevelInfo.level,
      new_title: newLevelInfo.title,
    });
  }

  return events;
}

// ============================================
// updateStreak
// ============================================

export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<GamificationEvent[]> {
  const events: GamificationEvent[] = [];
  const today = new Date().toISOString().split("T")[0] as string;

  const { data: streak } = await supabase
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!streak) {
    // First activity ever
    await supabase.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    });
    events.push({ type: "streak", streak_days: 1 });
    return events;
  }

  const streakData = streak as StreakInfo;
  const lastDate = streakData.last_activity_date;

  // Already active today
  if (lastDate === today) return events;

  const lastActivity = lastDate ? new Date(lastDate) : null;
  const todayDate = new Date(today);

  let newStreak = 1;

  if (lastActivity) {
    const diffMs = todayDate.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      newStreak = streakData.current_streak + 1;
    } else if (diffDays === 2 && streakData.freeze_count > 0) {
      // Use a freeze
      newStreak = streakData.current_streak + 1;
      await supabase
        .from("user_streaks")
        .update({ freeze_count: streakData.freeze_count - 1 })
        .eq("user_id", userId);
    }
    // else diffDays > 2 → streak reset to 1
  }

  const newLongest = Math.max(newStreak, streakData.longest_streak);

  await supabase
    .from("user_streaks")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
    })
    .eq("user_id", userId);

  events.push({ type: "streak", streak_days: newStreak });

  // Streak milestone XP
  if (newStreak === 7) {
    const xpEvents = await grantXP(supabase, userId, XP_REWARDS.streak_7, "streak", "streak_7");
    events.push(...xpEvents);
  } else if (newStreak === 30) {
    const xpEvents = await grantXP(supabase, userId, XP_REWARDS.streak_30, "streak", "streak_30");
    events.push(...xpEvents);
  } else if (newStreak === 100) {
    const xpEvents = await grantXP(supabase, userId, XP_REWARDS.streak_100, "streak", "streak_100");
    events.push(...xpEvents);
  }

  return events;
}

// ============================================
// checkBadges
// ============================================

export async function checkBadges(
  supabase: SupabaseClient,
  userId: string
): Promise<GamificationEvent[]> {
  const events: GamificationEvent[] = [];

  // Get all badges
  const { data: allBadges } = await supabase.from("badges").select("*");
  if (!allBadges || allBadges.length === 0) return events;

  // Get user's already unlocked badges
  const { data: unlockedRows } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const unlockedIds = new Set((unlockedRows ?? []).map((r: { badge_id: string }) => r.badge_id));

  // Get user stats for condition checks
  const stats = await getConditionStats(supabase, userId);

  for (const badge of allBadges as Badge[]) {
    if (unlockedIds.has(badge.id)) continue;

    const earned = evaluateBadgeCondition(badge.condition_type, badge.condition_value, stats);
    if (!earned) continue;

    // Grant badge
    await supabase.from("user_badges").insert({
      user_id: userId,
      badge_id: badge.id,
    });

    events.push({ type: "badge", badge });

    // Grant badge XP reward
    if (badge.xp_reward > 0) {
      const xpEvents = await grantXP(
        supabase,
        userId,
        badge.xp_reward,
        "badge",
        badge.slug
      );
      events.push(...xpEvents);
    }
  }

  return events;
}

interface ConditionStats {
  courses_completed: number;
  quizzes_completed: number;
  perfect_quizzes: number;
  streak_days: number;
  technologies_started: number;
  total_technologies: number;
  level_reached: number;
  night_study_count: number;
  comeback_days: number;
  techno_courses_complete: number;
  techno_all_perfect: number;
  daily_courses: number;
  redemption_perfect: number;
  early_adopter_rank: number;
  speed_perfect: number;
  referrals_count: number;
}

async function getConditionStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ConditionStats> {
  // Parallel queries for efficiency
  const [
    progressResult,
    streakResult,
    profileResult,
    technologiesResult,
    xpEventsResult,
    referralsResult,
  ] = await Promise.all([
    supabase
      .from("user_progress")
      .select("*, chapter:chapters(tech_id)")
      .eq("user_id", userId),
    supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("current_level, created_at")
      .eq("id", userId)
      .single(),
    supabase.from("technologies").select("id"),
    supabase
      .from("xp_events")
      .select("created_at, source")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", userId),
  ]);

  const progressRows = (progressResult.data ?? []) as Array<{
    completed: boolean;
    best_score: number | null;
    attempts: number;
    score: number | null;
    chapter: { tech_id: string } | null;
  }>;
  const streak = streakResult.data as StreakInfo | null;
  const profile = profileResult.data as { current_level: number; created_at: string } | null;
  const allTechs = (technologiesResult.data ?? []) as Array<{ id: string }>;
  const xpEvents = (xpEventsResult.data ?? []) as Array<{ created_at: string; source: string }>;

  // Courses completed (has progress entry with completed=true)
  const coursesCompleted = progressRows.filter((p) => p.completed).length;

  // Quizzes completed (has a score)
  const quizzesCompleted = progressRows.filter((p) => p.best_score !== null).length;

  // Perfect quizzes (best_score === 5, assuming 5 questions per quiz)
  const perfectQuizzes = progressRows.filter(
    (p) => p.best_score !== null && p.best_score === 5
  ).length;

  // Technologies started
  const techIds = new Set(
    progressRows
      .filter((p) => p.chapter)
      .map((p) => p.chapter!.tech_id)
  );
  const technologiesStarted = techIds.size;

  // Techno with all courses complete: count chapters per tech, check if all completed
  const techChapterMap = new Map<string, number>();
  const techCompletedMap = new Map<string, number>();
  for (const p of progressRows) {
    if (!p.chapter) continue;
    const tid = p.chapter.tech_id;
    techChapterMap.set(tid, (techChapterMap.get(tid) ?? 0) + 1);
    if (p.completed) {
      techCompletedMap.set(tid, (techCompletedMap.get(tid) ?? 0) + 1);
    }
  }

  // We need total chapters per tech to determine completion
  const { data: chapterCounts } = await supabase
    .from("chapters")
    .select("tech_id");
  const totalChaptersPerTech = new Map<string, number>();
  for (const c of (chapterCounts ?? []) as Array<{ tech_id: string }>) {
    totalChaptersPerTech.set(c.tech_id, (totalChaptersPerTech.get(c.tech_id) ?? 0) + 1);
  }

  let technoCoursesComplete = 0;
  let technoAllPerfect = 0;
  for (const [tid, total] of totalChaptersPerTech) {
    if ((techCompletedMap.get(tid) ?? 0) >= total) {
      technoCoursesComplete++;
    }
    // Check if all quizzes for this tech are perfect
    const techProgress = progressRows.filter(
      (p) => p.chapter?.tech_id === tid && p.best_score === 5
    );
    if (techProgress.length >= total) {
      technoAllPerfect++;
    }
  }

  // Night study: count distinct dates with activity between 00:00-05:00
  const nightDates = new Set<string>();
  for (const e of xpEvents) {
    const date = new Date(e.created_at);
    const hour = date.getHours();
    if (hour >= 0 && hour < 5) {
      nightDates.add(date.toISOString().split("T")[0] as string);
    }
  }

  // Comeback days: gap since last activity before today
  let comebackDays = 0;
  if (streak && streak.current_streak === 1 && xpEvents.length > 1) {
    // If streak just reset to 1, check how long the gap was
    const dates = xpEvents
      .map((e) => e.created_at.split("T")[0] as string)
      .filter((d, i, arr) => arr.indexOf(d) === i);
    if (dates.length >= 2) {
      const latest = new Date(dates[0] as string);
      const previous = new Date(dates[1] as string);
      const gap = Math.floor(
        (latest.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (gap >= 7) comebackDays = gap;
    }
  }

  // Daily courses: courses completed today
  const todayStr = new Date().toISOString().split("T")[0] as string;
  const todayEvents = xpEvents.filter(
    (e) => e.created_at.startsWith(todayStr) && e.source === "course"
  );

  // Redemption: perfect score after 3+ failed attempts
  let redemptionPerfect = 0;
  for (const p of progressRows) {
    if (p.best_score === 5 && p.attempts >= 4) {
      // At least 4 attempts (3 fails + 1 perfect)
      redemptionPerfect++;
    }
  }

  // Early adopter rank (based on profile creation order — simplified)
  // We count how many profiles were created before this user
  let earlyAdopterRank = 999;
  if (profile) {
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .lte("created_at", profile.created_at);
    earlyAdopterRank = count ?? 999;
  }

  return {
    courses_completed: coursesCompleted,
    quizzes_completed: quizzesCompleted,
    perfect_quizzes: perfectQuizzes,
    streak_days: streak?.current_streak ?? 0,
    technologies_started: technologiesStarted,
    total_technologies: allTechs.length,
    level_reached: profile?.current_level ?? 1,
    night_study_count: nightDates.size,
    comeback_days: comebackDays,
    techno_courses_complete: technoCoursesComplete,
    techno_all_perfect: technoAllPerfect,
    daily_courses: todayEvents.length,
    redemption_perfect: redemptionPerfect,
    early_adopter_rank: earlyAdopterRank,
    speed_perfect: 0, // Tracked via client-side timing, not checked here
    referrals_count: referralsResult.count ?? 0,
  };
}

function evaluateBadgeCondition(
  conditionType: string,
  conditionValue: number,
  stats: ConditionStats
): boolean {
  switch (conditionType) {
    case "courses_completed":
      return stats.courses_completed >= conditionValue;
    case "quizzes_completed":
      return stats.quizzes_completed >= conditionValue;
    case "perfect_quizzes":
      return stats.perfect_quizzes >= conditionValue;
    case "streak_days":
      return stats.streak_days >= conditionValue;
    case "technologies_started":
      return stats.technologies_started >= conditionValue;
    case "all_technologies":
      return stats.technologies_started >= stats.total_technologies && stats.total_technologies > 0;
    case "level_reached":
      return stats.level_reached >= conditionValue;
    case "night_study":
      return stats.night_study_count >= conditionValue;
    case "comeback_days":
      return stats.comeback_days >= conditionValue;
    case "techno_courses_complete":
      return stats.techno_courses_complete >= conditionValue;
    case "techno_all_perfect":
      return stats.techno_all_perfect >= conditionValue;
    case "daily_courses":
      return stats.daily_courses >= conditionValue;
    case "redemption_perfect":
      return stats.redemption_perfect >= conditionValue;
    case "early_adopter":
      return stats.early_adopter_rank <= conditionValue;
    case "speed_perfect":
      return stats.speed_perfect >= conditionValue;
    case "referrals":
      return stats.referrals_count >= conditionValue;
    default:
      return false;
  }
}

// ============================================
// getXPMultiplier
// ============================================

export async function getXPMultiplier(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data: streak } = await supabase
    .from("user_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .maybeSingle();

  if (!streak) return 1.0;

  const currentStreak = (streak as { current_streak: number }).current_streak;
  if (currentStreak >= 30) return 2.0;
  if (currentStreak >= 7) return 1.5;
  return 1.0;
}

// ============================================
// getUserStats
// ============================================

export async function getUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStats> {
  const [profileResult, streakResult, badgesResult, progressResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("xp_total, current_level, current_title")
        .eq("id", userId)
        .single(),
      supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_badges")
        .select("badge_id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("user_progress")
        .select("completed, best_score")
        .eq("user_id", userId),
    ]);

  const profile = profileResult.data as {
    xp_total: number;
    current_level: number;
    current_title: string;
  } | null;

  const xpTotal = profile?.xp_total ?? 0;
  const progressRows = (progressResult.data ?? []) as Array<{
    completed: boolean;
    best_score: number | null;
  }>;

  return {
    xp_total: xpTotal,
    current_level: profile?.current_level ?? 1,
    current_title: profile?.current_title ?? "Curieux",
    level_progress: getLevelProgress(xpTotal),
    streak: (streakResult.data as StreakInfo) ?? null,
    badges_count: badgesResult.count ?? 0,
    courses_completed: progressRows.filter((p) => p.completed).length,
    quizzes_completed: progressRows.filter((p) => p.best_score !== null).length,
    perfect_quizzes: progressRows.filter((p) => p.best_score === 5).length,
  };
}

// ============================================
// onCourseComplete — orchestrateur cours
// ============================================

export async function onCourseComplete(
  supabase: SupabaseClient,
  userId: string,
  chapterId: string
): Promise<GamificationEvent[]> {
  const events: GamificationEvent[] = [];

  // Get multiplier
  const multiplier = await getXPMultiplier(supabase, userId);
  const xp = Math.round(XP_REWARDS.course_complete * multiplier);

  // Grant XP
  const xpEvents = await grantXP(supabase, userId, xp, "course", chapterId);
  events.push(...xpEvents);

  // Update streak
  const streakEvents = await updateStreak(supabase, userId);
  events.push(...streakEvents);

  // Check badges
  const badgeEvents = await checkBadges(supabase, userId);
  events.push(...badgeEvents);

  return events;
}

// ============================================
// onQuizComplete — orchestrateur quiz
// ============================================

export async function onQuizComplete(
  supabase: SupabaseClient,
  userId: string,
  chapterId: string,
  score: number,
  totalQuestions: number
): Promise<GamificationEvent[]> {
  const events: GamificationEvent[] = [];

  // Get multiplier
  const multiplier = await getXPMultiplier(supabase, userId);

  // Calculate XP: base + per correct answer + perfect bonus
  let xp = XP_REWARDS.quiz_complete + score * XP_REWARDS.quiz_per_correct;
  if (score === totalQuestions) {
    xp += XP_REWARDS.quiz_perfect_bonus;
  }
  xp = Math.round(xp * multiplier);

  // Grant XP
  const xpEvents = await grantXP(supabase, userId, xp, "quiz", chapterId);
  events.push(...xpEvents);

  // Update streak
  const streakEvents = await updateStreak(supabase, userId);
  events.push(...streakEvents);

  // Check badges
  const badgeEvents = await checkBadges(supabase, userId);
  events.push(...badgeEvents);

  return events;
}

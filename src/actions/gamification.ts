"use server";

import { createClient } from "@/lib/supabase/server";
import {
  onCourseComplete,
  onQuizComplete,
  getUserStats,
} from "@/lib/gamification";
import type { GamificationEvent, UserStats, Badge, UserBadge, Challenge, UserChallenge } from "@/types";

// ============================================
// completeCourseAction
// ============================================

export async function completeCourseAction(
  chapterId: string
): Promise<{ success: boolean; events: GamificationEvent[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, events: [], error: "Non authentifié" };
  }

  const events = await onCourseComplete(supabase, user.id, chapterId);
  return { success: true, events };
}

// ============================================
// completeQuizAction
// ============================================

export async function completeQuizAction(
  chapterId: string,
  score: number,
  totalQuestions: number
): Promise<{ success: boolean; events: GamificationEvent[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, events: [], error: "Non authentifié" };
  }

  const events = await onQuizComplete(supabase, user.id, chapterId, score, totalQuestions);
  return { success: true, events };
}

// ============================================
// getUserStatsAction
// ============================================

export async function getUserStatsAction(): Promise<{
  success: boolean;
  stats: UserStats | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, stats: null, error: "Non authentifié" };
  }

  const stats = await getUserStats(supabase, user.id);
  return { success: true, stats };
}

// ============================================
// getUserBadgesAction
// ============================================

export async function getUserBadgesAction(): Promise<{
  success: boolean;
  badges: (UserBadge & { badge: Badge })[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, badges: [], error: "Non authentifié" };
  }

  const { data, error } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false });

  if (error) {
    return { success: false, badges: [], error: error.message };
  }

  return {
    success: true,
    badges: (data ?? []) as (UserBadge & { badge: Badge })[],
  };
}

// ============================================
// getActiveChallengesAction
// ============================================

export async function getActiveChallengesAction(): Promise<{
  success: boolean;
  challenges: (Challenge & { user_progress?: UserChallenge })[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, challenges: [], error: "Non authentifié" };
  }

  const today = new Date().toISOString().split("T")[0];

  // Get active challenges
  const { data: challenges, error } = await supabase
    .from("challenges")
    .select("*")
    .lte("start_date", today)
    .gte("end_date", today);

  if (error) {
    return { success: false, challenges: [], error: error.message };
  }

  if (!challenges || challenges.length === 0) {
    return { success: true, challenges: [] };
  }

  // Get user's progress on these challenges
  const challengeIds = (challenges as Challenge[]).map((c) => c.id);
  const { data: userChallenges } = await supabase
    .from("user_challenges")
    .select("*")
    .eq("user_id", user.id)
    .in("challenge_id", challengeIds);

  const progressMap = new Map(
    ((userChallenges ?? []) as UserChallenge[]).map((uc) => [uc.challenge_id, uc])
  );

  const result = (challenges as Challenge[]).map((c) => ({
    ...c,
    user_progress: progressMap.get(c.id),
  }));

  return { success: true, challenges: result };
}

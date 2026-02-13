"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserProgress, GamificationEvent } from "@/types";
import { PASSING_SCORE_PERCENT } from "@/lib/constants";
import { onQuizComplete } from "@/lib/gamification";

interface SaveResult {
  success: boolean;
  passed: boolean;
  xp: number;
  bestScore: number;
  gamificationEvents: GamificationEvent[];
  error?: string;
}

export async function saveQCMProgress(
  chapterId: string,
  score: number,
  total: number
): Promise<SaveResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, passed: false, xp: 0, bestScore: 0, gamificationEvents: [], error: "Non authentifié" };
  }

  const percent = (score / total) * 100;
  const passed = percent >= PASSING_SCORE_PERCENT;

  // Check if row exists
  const { data: existingRow } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("chapter_id", chapterId)
    .maybeSingle();

  const existing = existingRow as UserProgress | null;

  const payload = {
    user_id: user.id,
    chapter_id: chapterId,
    completed: passed || (existing?.completed ?? false),
    score,
    best_score: Math.max(score, existing?.best_score ?? 0),
    attempts: (existing?.attempts ?? 0) + 1,
    xp_earned: existing?.xp_earned ?? 0, // XP is now managed by gamification engine
    completed_at: passed
      ? new Date().toISOString()
      : existing?.completed_at ?? null,
  };

  if (existing) {
    const { error } = await supabase
      .from("user_progress")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      return { success: false, passed, xp: 0, bestScore: 0, gamificationEvents: [], error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("user_progress")
      .insert(payload);

    if (error) {
      return { success: false, passed, xp: 0, bestScore: 0, gamificationEvents: [], error: error.message };
    }
  }

  // Delegate XP, streaks, and badges to gamification engine
  const gamificationEvents = await onQuizComplete(supabase, user.id, chapterId, score, total);

  // Calculate total XP gained from events
  const xpGained = gamificationEvents
    .filter((e) => e.type === "xp")
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);

  // Update xp_earned on progress row
  if (xpGained > 0) {
    const newXpEarned = (existing?.xp_earned ?? 0) + xpGained;
    await supabase
      .from("user_progress")
      .update({ xp_earned: newXpEarned })
      .eq("user_id", user.id)
      .eq("chapter_id", chapterId);
  }

  return {
    success: true,
    passed,
    xp: xpGained,
    bestScore: Math.max(score, existing?.best_score ?? 0),
    gamificationEvents,
  };
}

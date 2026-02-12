"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProgress } from "@/types";
import { XP_PER_CORRECT_ANSWER, PASSING_SCORE_PERCENT } from "@/lib/constants";

export function useProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<Map<string, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchProgress() {
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId);

      if (data) {
        const map = new Map<string, UserProgress>();
        data.forEach((p) => map.set(p.chapter_id, p as UserProgress));
        setProgress(map);
      }

      setLoading(false);
    }

    fetchProgress();
  }, [userId, supabase]);

  const saveQCMResult = useCallback(
    async (chapterId: string, score: number, total: number) => {
      if (!userId) return;

      const xp = score * XP_PER_CORRECT_ANSWER;
      const percent = (score / total) * 100;
      const passed = percent >= PASSING_SCORE_PERCENT;

      const existing = progress.get(chapterId);

      // Upsert user_progress
      const { data: progressData } = await supabase
        .from("user_progress")
        .upsert(
          {
            user_id: userId,
            chapter_id: chapterId,
            completed: passed || (existing?.completed ?? false),
            score,
            best_score: Math.max(score, existing?.best_score ?? 0),
            attempts: (existing?.attempts ?? 0) + 1,
            xp_earned: Math.max(xp, existing?.xp_earned ?? 0),
            completed_at: passed ? new Date().toISOString() : existing?.completed_at ?? null,
          },
          { onConflict: "user_id,chapter_id" }
        )
        .select()
        .single();

      if (progressData) {
        setProgress((prev) => {
          const next = new Map(prev);
          next.set(chapterId, progressData as UserProgress);
          return next;
        });
      }

      // Update XP total in profile
      if (xp > (existing?.xp_earned ?? 0)) {
        const xpDiff = xp - (existing?.xp_earned ?? 0);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("xp_total")
          .eq("id", userId)
          .single();

        if (profileData) {
          await supabase
            .from("profiles")
            .update({ xp_total: (profileData.xp_total as number) + xpDiff })
            .eq("id", userId);
        }
      }

      return { passed, xp, bestScore: Math.max(score, existing?.best_score ?? 0) };
    },
    [userId, progress, supabase]
  );

  return { progress, loading, saveQCMResult };
}

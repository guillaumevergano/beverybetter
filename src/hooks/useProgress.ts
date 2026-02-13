"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserProgress } from "@/types";
import { XP_PER_CORRECT_ANSWER, PASSING_SCORE_PERCENT } from "@/lib/constants";

export function useProgress(userId: string | undefined) {
  const [progress, setProgress] = useState<Map<string, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchProgress() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.error("[useProgress] fetch error:", error.message);
      }

      if (data) {
        const map = new Map<string, UserProgress>();
        data.forEach((p) => map.set(p.chapter_id, p as UserProgress));
        setProgress(map);
      }

      setLoading(false);
    }

    fetchProgress();
  }, [userId]);

  const saveQCMResult = useCallback(
    async (chapterId: string, score: number, total: number) => {
      if (!userId) {
        console.error("[saveQCMResult] no userId, aborting save");
        return;
      }

      const supabase = createClient();
      const xp = score * XP_PER_CORRECT_ANSWER;
      const percent = (score / total) * 100;
      const passed = percent >= PASSING_SCORE_PERCENT;

      const existing = progress.get(chapterId);

      // Check if row exists in DB
      const { data: existingRow } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("chapter_id", chapterId)
        .maybeSingle();

      const row = existingRow as UserProgress | null;

      const payload = {
        user_id: userId,
        chapter_id: chapterId,
        completed: passed || (row?.completed ?? existing?.completed ?? false),
        score,
        best_score: Math.max(score, row?.best_score ?? existing?.best_score ?? 0),
        attempts: (row?.attempts ?? existing?.attempts ?? 0) + 1,
        xp_earned: Math.max(xp, row?.xp_earned ?? existing?.xp_earned ?? 0),
        completed_at: passed
          ? new Date().toISOString()
          : row?.completed_at ?? existing?.completed_at ?? null,
      };

      let savedRow: UserProgress | null = null;

      if (row) {
        // Update existing row
        const { data, error } = await supabase
          .from("user_progress")
          .update(payload)
          .eq("id", row.id)
          .select()
          .single();

        if (error) {
          console.error("[saveQCMResult] update error:", error.message);
          throw new Error(error.message);
        }
        savedRow = data as UserProgress;
      } else {
        // Insert new row
        const { data, error } = await supabase
          .from("user_progress")
          .insert(payload)
          .select()
          .single();

        if (error) {
          console.error("[saveQCMResult] insert error:", error.message);
          throw new Error(error.message);
        }
        savedRow = data as UserProgress;
      }

      if (savedRow) {
        setProgress((prev) => {
          const next = new Map(prev);
          next.set(chapterId, savedRow);
          return next;
        });
      }

      // Update XP total in profile
      const prevXp = row?.xp_earned ?? existing?.xp_earned ?? 0;
      if (xp > prevXp) {
        const xpDiff = xp - prevXp;

        const { data: profileData } = await supabase
          .from("profiles")
          .select("xp_total")
          .eq("id", userId)
          .single();

        if (profileData) {
          const { error: profileUpdateError } = await supabase
            .from("profiles")
            .update({ xp_total: (profileData.xp_total as number) + xpDiff })
            .eq("id", userId);

          if (profileUpdateError) {
            console.error("[saveQCMResult] profile update error:", profileUpdateError.message);
          }
        }
      }

      return { passed, xp, bestScore: Math.max(score, row?.best_score ?? existing?.best_score ?? 0) };
    },
    [userId, progress]
  );

  return { progress, loading, saveQCMResult };
}

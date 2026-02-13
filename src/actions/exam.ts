"use server";

import { createClient } from "@/lib/supabase/server";
import { grantXP, updateStreak, checkBadges } from "@/lib/gamification";
import type {
  Chapter,
  QCMQuestion,
  GeneratedContent,
  ExamQuestion,
  ExamQuestionClient,
  ExamResult,
  CertMention,
  GamificationEvent,
} from "@/types";

const EXAM_QUESTIONS_COUNT = 15;
const EXAM_DURATION_MINUTES = 20;
const MAX_ATTEMPTS_PER_WEEK = 3;
const PASSING_SCORE_PERCENT = 70;
const CERTIFICATION_XP_BONUS = 300;

// ============================================
// prepareExam
// ============================================

interface PrepareExamResult {
  success: boolean;
  questions?: ExamQuestionClient[];
  attemptId?: string;
  error?: string;
  prerequisites?: {
    chaptersIncomplete: { id: string; title: string }[];
    avgScore: number;
    requiredAvg: number;
    attemptsThisWeek: number;
    maxAttempts: number;
  };
}

export async function prepareExam(techId: string): Promise<PrepareExamResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Fetch chapters for this tech
  const { data: chaptersData } = await supabase
    .from("chapters")
    .select("*")
    .eq("tech_id", techId)
    .order("display_order");

  const chapters = (chaptersData ?? []) as Chapter[];
  if (chapters.length === 0) {
    return { success: false, error: "Technologie introuvable" };
  }

  // Get user progress for all chapters of this tech
  const chapterIds = chapters.map((c) => c.id);
  const { data: progressData } = await supabase
    .from("user_progress")
    .select("chapter_id, completed, best_score")
    .eq("user_id", user.id)
    .in("chapter_id", chapterIds);

  const progressMap = new Map(
    (progressData ?? []).map((p: { chapter_id: string; completed: boolean; best_score: number | null }) => [
      p.chapter_id,
      p,
    ])
  );

  // Check prerequisites
  const chaptersIncomplete: { id: string; title: string }[] = [];
  let totalScore = 0;
  let scoredChapters = 0;

  for (const ch of chapters) {
    const prog = progressMap.get(ch.id);
    if (!prog || !prog.completed) {
      chaptersIncomplete.push({ id: ch.id, title: ch.title });
    }
    if (prog?.best_score !== null && prog?.best_score !== undefined) {
      totalScore += (prog.best_score / 5) * 100; // Normalize to percentage
      scoredChapters++;
    }
  }

  const avgScore = scoredChapters > 0 ? Math.round(totalScore / scoredChapters) : 0;

  // Check weekly attempts
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: recentAttempts } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("technology_id", techId)
    .gte("completed_at", oneWeekAgo.toISOString());

  const attemptsThisWeek = (recentAttempts ?? []).length;

  // If prerequisites not met, return details
  if (chaptersIncomplete.length > 0 || avgScore < 80 || attemptsThisWeek >= MAX_ATTEMPTS_PER_WEEK) {
    return {
      success: false,
      error: "Prérequis non remplis",
      prerequisites: {
        chaptersIncomplete,
        avgScore,
        requiredAvg: 80,
        attemptsThisWeek,
        maxAttempts: MAX_ATTEMPTS_PER_WEEK,
      },
    };
  }

  // Fetch all QCM content for all chapters
  const { data: contentData } = await supabase
    .from("generated_content")
    .select("*")
    .in("chapter_id", chapterIds)
    .eq("content_type", "qcm");

  const allQuestions: ExamQuestion[] = [];
  const chapterTitleMap = new Map(chapters.map((c) => [c.id, c.title]));

  for (const content of (contentData ?? []) as GeneratedContent[]) {
    const questions = content.content as QCMQuestion[];
    for (const q of questions) {
      allQuestions.push({
        ...q,
        chapter_id: content.chapter_id,
        chapter_title: chapterTitleMap.get(content.chapter_id) ?? "",
      });
    }
  }

  if (allQuestions.length < EXAM_QUESTIONS_COUNT) {
    return { success: false, error: "Pas assez de questions disponibles pour l'examen" };
  }

  // Select questions: try to cover all chapters evenly, then fill randomly
  const selected: ExamQuestion[] = [];
  const byChapter = new Map<string, ExamQuestion[]>();
  for (const q of allQuestions) {
    const arr = byChapter.get(q.chapter_id) ?? [];
    arr.push(q);
    byChapter.set(q.chapter_id, arr);
  }

  // First pass: 1 question per chapter (shuffled)
  for (const [, chapterQuestions] of byChapter) {
    shuffle(chapterQuestions);
    const pick = chapterQuestions.shift();
    if (pick) selected.push(pick);
  }

  // Second pass: fill up to 15 from remaining
  const remaining = allQuestions.filter((q) => !selected.includes(q));
  shuffle(remaining);
  while (selected.length < EXAM_QUESTIONS_COUNT && remaining.length > 0) {
    const pick = remaining.shift();
    if (pick) selected.push(pick);
  }

  // Final shuffle
  shuffle(selected);

  // Create exam attempt record
  const { data: attempt, error: attemptError } = await supabase
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      technology_id: techId,
      score: 0,
      total: selected.length,
      passed: false,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    return { success: false, error: "Erreur lors de la création de l'examen" };
  }

  // Store the full questions server-side in a generated_content entry for later grading
  await supabase.from("generated_content").insert({
    chapter_id: chapterIds[0], // Required FK - use first chapter
    content_type: "qcm", // Reuse existing enum
    content: { exam_id: (attempt as { id: string }).id, questions: selected },
  });

  // Return questions WITHOUT correct answers
  const clientQuestions: ExamQuestionClient[] = selected.map((q, i) => ({
    question: q.question,
    options: q.options,
    chapter_title: q.chapter_title,
    index: i,
  }));

  return {
    success: true,
    questions: clientQuestions,
    attemptId: (attempt as { id: string }).id,
  };
}

// ============================================
// submitExam
// ============================================

interface SubmitExamInput {
  techId: string;
  attemptId: string;
  answers: (number | null)[];
}

export async function submitExam(
  input: SubmitExamInput
): Promise<{ success: boolean; result?: ExamResult; events?: GamificationEvent[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  // Retrieve the attempt
  const { data: attemptData } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", input.attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attemptData) {
    return { success: false, error: "Tentative d'examen introuvable" };
  }

  const attempt = attemptData as { id: string; completed_at: string; score: number; passed: boolean };

  // Check timer: completed_at was set at creation, check if within 20 min + 30s grace
  const startTime = new Date(attempt.completed_at);
  const now = new Date();
  const elapsedMs = now.getTime() - startTime.getTime();
  const maxMs = (EXAM_DURATION_MINUTES + 0.5) * 60 * 1000;

  if (elapsedMs > maxMs) {
    return { success: false, error: "Le temps imparti est dépassé" };
  }

  // Retrieve stored questions
  const { data: storedContent } = await supabase
    .from("generated_content")
    .select("content")
    .contains("content", { exam_id: input.attemptId })
    .single();

  if (!storedContent) {
    return { success: false, error: "Questions d'examen introuvables" };
  }

  const examData = storedContent.content as { exam_id: string; questions: ExamQuestion[] };
  const questions = examData.questions;

  // Grade the exam
  let score = 0;
  const answersNormalized = input.answers.map((a) => a ?? -1);
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (q && answersNormalized[i] === q.correct) {
      score++;
    }
  }

  const total = questions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= PASSING_SCORE_PERCENT;

  // Determine mention
  let mention: CertMention | null = null;
  if (passed) {
    if (percentage >= 95) mention = "Exceptionnelle";
    else if (percentage >= 85) mention = "Très Bien";
    else mention = "Bien";
  }

  // Update attempt
  await supabase
    .from("exam_attempts")
    .update({ score, passed, completed_at: now.toISOString() })
    .eq("id", input.attemptId);

  // Get weekly attempts count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: recentAttempts } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("user_id", user.id)
    .eq("technology_id", input.techId)
    .gte("completed_at", oneWeekAgo.toISOString());

  const attemptsThisWeek = (recentAttempts ?? []).length;

  let certNumber: string | null = null;
  const events: GamificationEvent[] = [];

  if (passed) {
    // Check if already certified for this tech
    const { data: existingCert } = await supabase
      .from("user_certifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("technology_id", input.techId)
      .maybeSingle();

    if (!existingCert) {
      // Generate unique cert number
      const year = new Date().getFullYear();
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      certNumber = `CERT-${year}-${code}`;
      const verificationUrl = `/verify/${certNumber}`;

      await supabase.from("user_certifications").insert({
        user_id: user.id,
        technology_id: input.techId,
        exam_attempt_id: input.attemptId,
        cert_number: certNumber,
        score,
        total,
        mention: mention!,
        verification_url: verificationUrl,
      });

      // Grant certification XP bonus
      const xpEvents = await grantXP(supabase, user.id, CERTIFICATION_XP_BONUS, "certification", certNumber);
      events.push(...xpEvents);
    }

    // Update streak and check badges
    const streakEvents = await updateStreak(supabase, user.id);
    events.push(...streakEvents);
    const badgeEvents = await checkBadges(supabase, user.id);
    events.push(...badgeEvents);
  }

  return {
    success: true,
    events,
    result: {
      passed,
      score,
      total,
      percentage,
      mention,
      cert_number: certNumber,
      questions,
      answers: answersNormalized,
      attemptsThisWeek,
      maxAttemptsPerWeek: MAX_ATTEMPTS_PER_WEEK,
    },
  };
}

// ============================================
// Helpers
// ============================================

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { QCMQuestion } from "@/components/qcm/QCMQuestion";
import { QCMOptions } from "@/components/qcm/QCMOptions";
import { QCMResult } from "@/components/qcm/QCMResult";
import { ScoreCard } from "@/components/qcm/ScoreCard";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { QCMQuestion as QCMQuestionType, Technology, Chapter } from "@/types";

export default function QCMPage() {
  const params = useParams<{ techId: string; chapterId: string }>();
  const { user } = useAuth();
  const { saveQCMResult } = useProgress(user?.id);

  const [questions, setQuestions] = useState<QCMQuestionType[]>([]);
  const [tech, setTech] = useState<Technology | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadQCM = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);

    try {
      const [{ data: techData }, { data: chapterData }] = await Promise.all([
        supabase.from("technologies").select("*").eq("id", params.techId).single(),
        supabase.from("chapters").select("*").eq("id", params.chapterId).single(),
      ]);

      setTech(techData as Technology);
      setChapter(chapterData as Chapter);

      // Check cache first
      const { data: cached } = await supabase
        .from("generated_content")
        .select("*")
        .eq("chapter_id", params.chapterId)
        .eq("content_type", "qcm")
        .single();

      if (cached) {
        setQuestions(cached.content as QCMQuestionType[]);
      } else {
        throw new Error("Le QCM de ce chapitre n'est pas encore disponible.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [params.techId, params.chapterId, supabase]);

  useEffect(() => {
    loadQCM();
  }, [loadQCM]);

  function handleSelect(optionIndex: number) {
    if (showResult) return;
    setSelected(optionIndex);
  }

  async function handleValidate() {
    if (selected === null) return;

    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const isCorrect = selected === currentQuestion.correct;
    if (isCorrect) setScore((s) => s + 1);
    setShowResult(true);

    // Save answer to qcm_answers if we have a session
    // Session will be created on finish
  }

  async function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);

      if (user) {
        await saveQCMResult(params.chapterId, score, questions.length);

        // Create QCM session record
        await supabase.from("qcm_sessions").insert({
          user_id: user.id,
          chapter_id: params.chapterId,
          score,
          total: questions.length,
        });
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Spinner size="lg" />
        <p className="text-[#64748b] text-sm">Chargement du QCM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-[#ef4444]">{error}</p>
        <Button onClick={loadQCM}>Réessayer</Button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <ScoreCard
          score={score}
          total={questions.length}
          techId={params.techId}
          onRetry={loadQCM}
        />
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        {tech && <span className="text-xl">{tech.icon}</span>}
        {chapter && (
          <h1
            className="text-lg font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            QCM — {chapter.title}
          </h1>
        )}
      </div>

      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <QCMQuestion
          question={currentQuestion.question}
          current={currentIndex + 1}
          total={questions.length}
        />

        <QCMOptions
          options={currentQuestion.options}
          selected={selected}
          correct={showResult ? currentQuestion.correct : null}
          onSelect={handleSelect}
          disabled={showResult}
        />

        {showResult && (
          <QCMResult
            explanation={currentQuestion.explanation}
            isCorrect={selected === currentQuestion.correct}
          />
        )}

        <div className="mt-6 flex justify-end">
          {!showResult ? (
            <Button onClick={handleValidate} disabled={selected === null}>
              Valider
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {currentIndex + 1 >= questions.length ? "Voir le résultat" : "Suivant"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

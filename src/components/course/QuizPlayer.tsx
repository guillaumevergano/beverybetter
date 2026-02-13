"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InlineFormat } from "./InlineFormat";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/components/gamification/GamificationProvider";
import { saveQCMProgress } from "@/actions/saveProgress";
import type { QCMQuestion, QuizAnswer } from "@/types";

interface QuizPlayerProps {
  questions: QCMQuestion[];
  techColor: string;
  chapterId: string;
  techId: string;
  nextChapterUrl: string | null;
}

const LABELS = ["A", "B", "C", "D"] as const;

function getAppreciation(score: number, total: number) {
  const ratio = score / total;
  if (ratio === 1) return { emoji: "🎯", title: "Parfait !", subtitle: "Tu maîtrises ce chapitre." };
  if (ratio >= 0.8) return { emoji: "🔥", title: "Excellent !", subtitle: "Presque parfait, bravo." };
  if (ratio >= 0.6) return { emoji: "👍", title: "Bien joué !", subtitle: "Tu as compris l'essentiel." };
  if (ratio >= 0.4) return { emoji: "💪", title: "Pas mal", subtitle: "Relis le cours pour progresser." };
  return { emoji: "📚", title: "Continue !", subtitle: "Reprends le cours et réessaie." };
}

export function QuizPlayer({ questions, techColor, chapterId, techId, nextChapterUrl }: QuizPlayerProps) {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const { triggerEvents } = useGamification();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [expandedRecap, setExpandedRecap] = useState<number | null>(null);
  const [slideKey, setSlideKey] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const total = questions.length;
  const score = answers.filter((a) => a.isCorrect).length;
  const progress = ((currentIndex + (isAnswered ? 1 : 0)) / total) * 100;

  // Save results when quiz is complete
  useEffect(() => {
    if (!showResults || saveStatus !== "idle") return;

    let cancelled = false;
    setSaveStatus("saving");

    saveQCMProgress(chapterId, score, total)
      .then((result) => {
        if (cancelled) return;
        if (!result.success) {

          setSaveStatus("error");
          return;
        }
        setSaveStatus("saved");
        if (result.gamificationEvents && result.gamificationEvents.length > 0) {
          triggerEvents(result.gamificationEvents);
        }
        refreshProfile();
        router.refresh();
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("[QuizPlayer] save failed:", message);

        setSaveStatus("error");
      });

    return () => { cancelled = true; };
  }, [showResults, saveStatus, chapterId, score, total, refreshProfile, router, triggerEvents]);

  function handleSelectAnswer(index: number) {
    if (isAnswered) return;

    const question = questions[currentIndex];
    if (!question) return;

    setSelectedAnswer(index);
    setIsAnswered(true);
    setAnswers((prev) => [
      ...prev,
      { questionIndex: currentIndex, selectedAnswer: index, isCorrect: index === question.correct },
    ]);
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
      setSlideKey((k) => k + 1);
    }
  }

  function handleRetry() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswers([]);
    setShowResults(false);
    setExpandedRecap(null);
    setSlideKey(0);
    setSaveStatus("idle");
  }

  // --- Results screen ---
  if (showResults) {
    const appreciation = getAppreciation(score, total);
    const circumference = 2 * Math.PI * 54;
    const strokeOffset = circumference - (score / total) * circumference;

    return (
      <div className="space-y-8 animate-fade-in">
        {/* Score circle */}
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-4xl">{appreciation.emoji}</div>
          <div className="relative">
            <svg width="140" height="140" className="-rotate-90">
              <circle cx="70" cy="70" r="54" stroke="#e2e8f0" strokeWidth="10" fill="none" />
              <circle
                cx="70" cy="70" r="54"
                stroke={techColor}
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ animation: "score-fill 1s ease-out forwards" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-3xl font-bold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: techColor }}
              >
                {score}/{total}
              </span>
            </div>
          </div>
          <div className="text-center">
            <h2
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {appreciation.title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{appreciation.subtitle}</p>
          </div>
        </div>

        {/* Recap */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-600">Récapitulatif</span>
          </div>
          <div className="divide-y divide-slate-100">
            {questions.map((q, i) => {
              const answer = answers[i];
              const isCorrect = answer?.isCorrect ?? false;
              const isExpanded = expandedRecap === i;

              return (
                <div key={i}>
                  <button
                    onClick={() => setExpandedRecap(isExpanded ? null : i)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <span
                      className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: isCorrect ? "#10b981" : "#ef4444" }}
                    >
                      {isCorrect ? "✓" : "✗"}
                    </span>
                    <span className="flex-1 text-sm text-slate-700 truncate">
                      <InlineFormat text={q.question} />
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#94a3b8" strokeWidth="2"
                      className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="px-5 pb-4 animate-fade-in">
                      <div className="ml-9 space-y-2">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
                              oi === q.correct
                                ? "bg-green-50 text-green-800 border border-green-200"
                                : oi === answer?.selectedAnswer && !isCorrect
                                  ? "bg-red-50 text-red-800 border border-red-200"
                                  : "text-slate-500"
                            }`}
                          >
                            <span className="font-mono text-xs font-bold w-5">{LABELS[oi]}</span>
                            <InlineFormat text={opt} />
                          </div>
                        ))}
                        <div
                          className="mt-2 p-3 rounded-xl bg-slate-50 border-l-4 text-sm text-slate-600"
                          style={{ borderLeftColor: techColor }}
                        >
                          <span className="mr-1.5">💡</span>
                          <InlineFormat text={q.explanation} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 text-sm font-semibold transition-all hover:bg-slate-50"
            style={{ borderColor: techColor, color: techColor }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            Réessayer le QCM
          </button>
          <Link
            href={`/learn/${techId}/${chapterId}`}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-slate-200 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
          >
            Revoir le cours
          </Link>
          {nextChapterUrl ? (
            <Link
              href={nextChapterUrl}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: techColor }}
            >
              Chapitre suivant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link
              href={`/learn/${techId}`}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: techColor }}
            >
              Retour au parcours
            </Link>
          )}
        </div>
      </div>
    );
  }

  // --- Question screen ---
  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-slate-500">
            Question {currentIndex + 1} / {total}
          </span>
          <span className="text-xs font-bold" style={{ color: techColor }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: techColor }}
          />
        </div>
      </div>

      {/* Question card */}
      <div
        key={slideKey}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
        style={{ animation: "slideIn 0.3s ease-out" }}
      >
        {/* Question text */}
        <h2
          className="text-lg font-semibold text-slate-900 mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <InlineFormat text={question.question} />
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {question.options.map((option, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrectOption = i === question.correct;
            const isWrong = isAnswered && isSelected && !isCorrectOption;
            const isRight = isAnswered && isCorrectOption;

            return (
              <button
                key={i}
                onClick={() => handleSelectAnswer(i)}
                disabled={isAnswered}
                className={`flex items-center gap-3.5 w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all min-h-[48px] ${
                  isRight
                    ? "bg-green-50 border-green-300"
                    : isWrong
                      ? "bg-red-50 border-red-300 animate-shake"
                      : isAnswered
                        ? "bg-slate-50 border-slate-100 opacity-60"
                        : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer"
                }`}
              >
                {/* Letter badge */}
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isRight
                      ? "bg-green-500 text-white"
                      : isWrong
                        ? "bg-red-500 text-white"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isRight ? "✓" : isWrong ? "✗" : LABELS[i]}
                </span>
                {/* Option text */}
                <span className={`flex-1 text-sm font-medium ${
                  isRight ? "text-green-800" : isWrong ? "text-red-800" : "text-slate-700"
                }`}>
                  <InlineFormat text={option} />
                </span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isAnswered && (
          <div
            className="mt-5 p-4 rounded-xl bg-slate-50 border-l-4 animate-fade-in"
            style={{ borderLeftColor: techColor }}
          >
            <div className="flex items-start gap-2 text-sm text-slate-700">
              <span className="shrink-0 text-base">💡</span>
              <span className="flex-1 leading-relaxed">
                <InlineFormat text={question.explanation} />
              </span>
            </div>
          </div>
        )}

        {/* Next button */}
        {isAnswered && (
          <div className="mt-6 flex justify-end animate-fade-in">
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: techColor }}
            >
              {currentIndex + 1 >= total ? "Voir mes résultats" : "Question suivante"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

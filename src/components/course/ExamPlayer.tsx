"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InlineFormat } from "./InlineFormat";
import { ScoreCircle } from "@/components/gamification/ScoreCircle";
import { useGamification } from "@/components/gamification/GamificationProvider";
import { useAuth } from "@/hooks/useAuth";
import { prepareExam, submitExam } from "@/actions/exam";
import type { ExamQuestionClient, ExamResult, ExamQuestion } from "@/types";

interface ExamPlayerProps {
  techId: string;
  techColor: string;
  techName: string;
}

const LABELS = ["A", "B", "C", "D"] as const;
const EXAM_DURATION_SECONDS = 20 * 60; // 20 minutes

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ExamPlayer({ techId, techColor, techName }: ExamPlayerProps) {
  const router = useRouter();
  const { triggerEvents } = useGamification();
  const { refreshProfile } = useAuth();

  // Exam state
  const [status, setStatus] = useState<"loading" | "ready" | "in_progress" | "submitting" | "results" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestionClient[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION_SECONDS);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submittedRef = useRef(false);

  // Load exam on mount
  useEffect(() => {
    prepareExam(techId).then((res) => {
      if (res.success && res.questions && res.attemptId) {
        setQuestions(res.questions);
        setAttemptId(res.attemptId);
        setAnswers(new Array(res.questions.length).fill(null));
        setStatus("ready");
      } else {
        setError(res.error ?? "Erreur lors de la préparation de l'examen");
        setStatus("error");
      }
    });
  }, [techId]);

  const handleSubmit = useCallback(async () => {
    if (!attemptId || submittedRef.current) return;
    submittedRef.current = true;
    setStatus("submitting");

    if (timerRef.current) clearInterval(timerRef.current);

    const res = await submitExam({ techId, attemptId, answers });
    if (res.success && res.result) {
      setResult(res.result);
      setStatus("results");
      if (res.events) {
        triggerEvents(res.events);
      }
      refreshProfile();
      router.refresh();
    } else {
      setError(res.error ?? "Erreur lors de la soumission");
      setStatus("error");
    }
  }, [attemptId, answers, techId, triggerEvents, refreshProfile, router]);

  // Timer
  useEffect(() => {
    if (status !== "in_progress") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up — auto submit
          if (!submittedRef.current) {
            submittedRef.current = true;
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, handleSubmit]);

  function handleSelectAnswer(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = optionIndex;
      return next;
    });
  }

  function startExam() {
    setStatus("in_progress");
    submittedRef.current = false;
  }

  const answeredCount = answers.filter((a) => a !== null).length;
  const timerColor = timeLeft < 60 ? "#ef4444" : timeLeft < 300 ? "#f59e0b" : "#94a3b8";
  const timerBlink = timeLeft < 60 ? "animate-pulse" : timeLeft < 300 ? "animate-pulse" : "";

  // --- Loading ---
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-[#e2e8f0] border-t-[#0070f3] rounded-full animate-spin" />
        <p className="text-sm text-[#64748b]">Préparation de l&apos;examen...</p>
      </div>
    );
  }

  // --- Error ---
  if (status === "error") {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-4xl">❌</div>
        <p className="text-[#ef4444] font-semibold">{error}</p>
        <Link
          href={`/learn/${techId}`}
          className="inline-flex px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0070f3] hover:opacity-90 transition-all"
        >
          Retour
        </Link>
      </div>
    );
  }

  // --- Ready (start screen) ---
  if (status === "ready") {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-8">
        <div className="text-5xl">🎓</div>
        <h2
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Examen de Certification
        </h2>
        <p className="text-[#64748b]">{techName}</p>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">📝</span>
            <span className="text-sm text-[#0f172a]"><strong>{questions.length}</strong> questions</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">⏱️</span>
            <span className="text-sm text-[#0f172a]"><strong>20 minutes</strong> maximum</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <span className="text-sm text-[#0f172a]">Score minimum : <strong>70%</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">🔄</span>
            <span className="text-sm text-[#0f172a]">Navigation libre entre les questions</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <span className="text-sm text-[#0f172a]">Pas de feedback immédiat</span>
          </div>
        </div>

        <button
          onClick={startExam}
          className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: techColor }}
        >
          Commencer l&apos;examen
        </button>
      </div>
    );
  }

  // --- Submitting ---
  if (status === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-[#e2e8f0] border-t-[#0070f3] rounded-full animate-spin" />
        <p className="text-sm text-[#64748b]">Correction en cours...</p>
      </div>
    );
  }

  // --- Results ---
  if (status === "results" && result) {
    return <ExamResults result={result} techColor={techColor} techId={techId} techName={techName} />;
  }

  // --- In progress ---
  const question = questions[currentIndex];
  if (!question) return null;

  return (
    <div>
      {/* Timer + question navigation */}
      <div className="flex items-center justify-between mb-4">
        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all ${
                i === currentIndex
                  ? "text-white"
                  : answers[i] !== null
                    ? "bg-[#0070f3]/20 text-[#0070f3]"
                    : "bg-[#f1f5f9] text-[#94a3b8]"
              }`}
              style={i === currentIndex ? { backgroundColor: techColor } : undefined}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0f172a] ${timerBlink}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={timerColor} strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span className="text-xs font-mono font-bold" style={{ color: timerColor }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#64748b]">
            Question {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-xs text-[#64748b]">
            {answeredCount} répondue{answeredCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${(answeredCount / questions.length) * 100}%`, backgroundColor: techColor }}
          />
        </div>
      </div>

      {/* Chapter tag */}
      <div className="mb-3">
        <span className="text-[10px] font-medium text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded">
          {question.chapter_title}
        </span>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-5 sm:p-6">
        <h2
          className="text-lg font-semibold text-[#0f172a] mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <InlineFormat text={question.question} />
        </h2>

        <div className="flex flex-col gap-3">
          {question.options.map((option, i) => {
            const isSelected = answers[currentIndex] === i;
            return (
              <button
                key={i}
                onClick={() => handleSelectAnswer(i)}
                className={`flex items-center gap-3.5 w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all min-h-[48px] cursor-pointer ${
                  isSelected
                    ? "border-[#0070f3] bg-[#eff6ff]"
                    : "bg-white border-[#e2e8f0] hover:border-[#94a3b8] hover:shadow-sm"
                }`}
                style={isSelected ? { borderColor: techColor, backgroundColor: `${techColor}10` } : undefined}
              >
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isSelected ? "text-white" : "bg-[#f1f5f9] text-[#64748b]"
                  }`}
                  style={isSelected ? { backgroundColor: techColor } : undefined}
                >
                  {LABELS[i]}
                </span>
                <span className={`flex-1 text-sm font-medium ${isSelected ? "text-[#0f172a]" : "text-[#64748b]"}`}>
                  <InlineFormat text={option} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-all disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Précédente
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: techColor }}
          >
            Suivante
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: techColor }}
          >
            Terminer l&apos;examen
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl animate-fade-in">
            <h3
              className="text-lg font-bold text-[#0f172a] mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Terminer l&apos;examen ?
            </h3>
            <p className="text-sm text-[#64748b] mb-5">
              Tu as répondu à {answeredCount}/{questions.length} questions.
              {answeredCount < questions.length && " Les questions sans réponse seront comptées comme fausses."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-all"
              >
                Continuer
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: techColor }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// ExamResults sub-component
// ============================================

function ExamResults({
  result,
  techColor,
  techId,
  techName,
}: {
  result: ExamResult;
  techColor: string;
  techId: string;
  techName: string;
}) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  // Group questions by chapter
  const chapterScores = new Map<string, { correct: number; total: number }>();
  for (let i = 0; i < result.questions.length; i++) {
    const q = result.questions[i] as ExamQuestion;
    const isCorrect = result.answers[i] === q.correct;
    const entry = chapterScores.get(q.chapter_title) ?? { correct: 0, total: 0 };
    entry.total++;
    if (isCorrect) entry.correct++;
    chapterScores.set(q.chapter_title, entry);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Confetti for passed */}
      {result.passed && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: "-5%",
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2.5 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-2 h-2 rounded-sm"
                style={{
                  backgroundColor: ["#0070f3", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Score */}
      <div className="flex flex-col items-center gap-4 py-6">
        <div className="text-4xl">{result.passed ? "🎓" : "📚"}</div>
        <ScoreCircle
          score={result.score}
          total={result.total}
          size={160}
          color={techColor}
          showPercentage
          label={result.passed ? `Certifié — ${result.mention}` : "Non certifié"}
        />
        <div className="text-center">
          <h2
            className="text-xl font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {result.passed ? `Certifié en ${techName} !` : "Pas encore certifié"}
          </h2>
          <p className="text-sm text-[#64748b] mt-1">
            {result.passed
              ? `Mention : ${result.mention} — ${result.score}/${result.total} bonnes réponses`
              : `Score minimum requis : 70% — Tu as obtenu ${result.percentage}%`}
          </p>
        </div>
      </div>

      {/* Chapter breakdown */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
        <h3
          className="text-sm font-bold text-[#0f172a] mb-3"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Détail par chapitre
        </h3>
        <div className="space-y-2">
          {Array.from(chapterScores.entries()).map(([title, data]) => {
            const pct = Math.round((data.correct / data.total) * 100);
            const color = pct >= 80 ? "#10b981" : pct >= 60 ? "#f59e0b" : "#ef4444";
            return (
              <div key={title} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#0f172a] truncate">{title}</p>
                </div>
                <div className="w-24 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden shrink-0">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                <span className="text-xs font-bold shrink-0 w-10 text-right" style={{ color }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Question recap */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <span className="text-sm font-semibold text-[#64748b]">Récapitulatif des questions</span>
        </div>
        <div className="divide-y divide-[#e2e8f0]">
          {result.questions.map((q, i) => {
            const userAnswer = result.answers[i];
            const isCorrect = userAnswer === q.correct;
            const isExpanded = expandedQ === i;

            return (
              <div key={i}>
                <button
                  onClick={() => setExpandedQ(isExpanded ? null : i)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f8fafc] transition-colors"
                >
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: isCorrect ? "#10b981" : "#ef4444" }}
                  >
                    {isCorrect ? "✓" : "✗"}
                  </span>
                  <span className="flex-1 text-sm text-[#0f172a] truncate">
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
                              : oi === userAnswer && !isCorrect
                                ? "bg-red-50 text-red-800 border border-red-200"
                                : "text-[#94a3b8]"
                          }`}
                        >
                          <span className="font-mono text-xs font-bold w-5">{LABELS[oi]}</span>
                          <InlineFormat text={opt} />
                        </div>
                      ))}
                      <div
                        className="mt-2 p-3 rounded-xl bg-[#f8fafc] border-l-4 text-sm text-[#64748b]"
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
        {result.passed && result.cert_number && (
          <>
            <Link
              href={`/api/certificate/${result.cert_number}`}
              target="_blank"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: techColor }}
            >
              📄 Télécharger le PDF
            </Link>
            <Link
              href="/profile"
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm font-semibold text-[#64748b] transition-all hover:bg-[#f1f5f9]"
            >
              Voir mon profil
            </Link>
          </>
        )}
        {!result.passed && (
          <>
            <Link
              href={`/learn/${techId}`}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: techColor }}
            >
              📖 Revoir les cours
            </Link>
            <p className="text-xs text-[#94a3b8] text-center">
              {result.attemptsThisWeek}/{result.maxAttemptsPerWeek} tentatives cette semaine
            </p>
          </>
        )}
      </div>
    </div>
  );
}

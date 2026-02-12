"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { scoreEmoji, scoreMessage, formatXP } from "@/lib/utils";
import { XP_PER_CORRECT_ANSWER, PASSING_SCORE_PERCENT } from "@/lib/constants";

interface ScoreCardProps {
  score: number;
  total: number;
  techId: string;
  onRetry: () => void;
}

export function ScoreCard({ score, total, techId, onRetry }: ScoreCardProps) {
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= PASSING_SCORE_PERCENT;
  const xp = score * XP_PER_CORRECT_ANSWER;

  return (
    <div className="text-center space-y-6 animate-fade-in">
      <div className="text-5xl">{scoreEmoji(score, total)}</div>

      <div>
        <h2
          className="text-2xl font-bold text-[#0f172a] mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {scoreMessage(score, total)}
        </h2>
        <p className="text-[#64748b]">
          {score}/{total} bonnes réponses
        </p>
      </div>

      <div className="flex justify-center">
        <ProgressRing
          percentage={percentage}
          size={100}
          strokeWidth={8}
          color={passed ? "#10b981" : "#f59e0b"}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <span className="text-lg font-bold" style={{ color: passed ? "#10b981" : "#f59e0b" }}>
          +{formatXP(xp)}
        </span>
        {passed && (
          <span className="text-xs bg-[#d1fae5] text-[#065f46] px-2 py-1 rounded-full font-semibold">
            Chapitre validé
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
        <Link href={`/learn/${techId}`}>
          <Button>Retour aux chapitres</Button>
        </Link>
      </div>
    </div>
  );
}

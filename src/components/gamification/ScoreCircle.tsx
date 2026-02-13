"use client";

import { useEffect, useState } from "react";

interface ScoreCircleProps {
  score: number;
  total: number;
  color?: string;
  size?: number;
  label?: string;
  showPercentage?: boolean;
}

function getScoreColor(score: number, total: number): string {
  const percent = (score / total) * 100;
  if (percent >= 80) return "#10b981";
  if (percent >= 60) return "#f59e0b";
  return "#ef4444";
}

export function ScoreCircle({
  score,
  total,
  color,
  size = 120,
  label,
  showPercentage = false,
}: ScoreCircleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to trigger CSS transition on mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const resolvedColor = color ?? getScoreColor(score, total);
  const strokeWidth = Math.max(6, size * 0.08);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? (score / total) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  const displayValue = showPercentage
    ? `${Math.round(percentage)}%`
    : `${score}/${total}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={resolvedColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
          />
        </svg>
        <span
          className="absolute font-bold"
          style={{
            color: resolvedColor,
            fontSize: size * 0.2,
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {displayValue}
        </span>
      </div>
      {label && (
        <span className="text-xs font-medium text-[#64748b]">{label}</span>
      )}
    </div>
  );
}

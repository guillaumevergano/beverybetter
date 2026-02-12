"use client";

import { cn } from "@/lib/utils";

interface QCMOptionsProps {
  options: [string, string, string, string];
  selected: number | null;
  correct: number | null;
  onSelect: (index: number) => void;
  disabled: boolean;
}

export function QCMOptions({ options, selected, correct, onSelect, disabled }: QCMOptionsProps) {
  return (
    <div className="space-y-3">
      {options.map((option, i) => {
        const isSelected = selected === i;
        const isCorrect = correct === i;
        const isWrong = isSelected && correct !== null && !isCorrect;

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            disabled={disabled}
            className={cn(
              "w-full text-left px-5 py-3.5 rounded-[12px] border-2 text-sm font-medium transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              !isSelected && correct === null &&
                "border-[#e2e8f0] hover:border-[#0070f3] hover:bg-[#f0f7ff]",
              isSelected && correct === null &&
                "border-[#0070f3] bg-[#f0f7ff] text-[#0070f3]",
              isCorrect &&
                "border-[#10b981] bg-[#d1fae5] text-[#065f46]",
              isWrong &&
                "border-[#ef4444] bg-[#fee2e2] text-[#991b1b] animate-shake",
              disabled && !isCorrect && !isWrong && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className="inline-flex items-center gap-3">
              <span
                className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                  isCorrect && "border-[#10b981] bg-[#10b981] text-white",
                  isWrong && "border-[#ef4444] bg-[#ef4444] text-white",
                  !isCorrect && !isWrong && isSelected && "border-[#0070f3] bg-[#0070f3] text-white",
                  !isCorrect && !isWrong && !isSelected && "border-[#cbd5e1]"
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </span>
          </button>
        );
      })}
    </div>
  );
}

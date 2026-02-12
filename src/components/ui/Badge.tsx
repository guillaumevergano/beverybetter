import type { ChapterLevel } from "@/types";
import { LEVEL_COLORS } from "@/types";

interface BadgeProps {
  level: ChapterLevel;
}

export function Badge({ level }: BadgeProps) {
  const colors = LEVEL_COLORS[level];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-semibold capitalize"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: colors.dot }}
      />
      {level}
    </span>
  );
}

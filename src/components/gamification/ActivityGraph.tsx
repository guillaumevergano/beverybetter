"use client";

import { useState, useMemo } from "react";

interface ActivityDay {
  date: string;
  count: number;
  xp: number;
}

interface ActivityGraphProps {
  activityData: ActivityDay[];
}

const COLORS = {
  0: "#ebedf0",
  1: "#9be9a8",
  2: "#40c463",
  3: "#30a14e",
  4: "#216e39",
} as const;

function getIntensity(count: number): keyof typeof COLORS {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

function formatTooltipDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

const DAYS_TO_SHOW = 91; // ~13 weeks
const CELL_SIZE = 11;
const CELL_GAP = 2;

export function ActivityGraph({ activityData }: ActivityGraphProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    data: ActivityDay;
  } | null>(null);

  const { grid, months } = useMemo(() => {
    // Build a map of date -> activity
    const dataMap = new Map<string, ActivityDay>();
    for (const d of activityData) {
      dataMap.set(d.date, d);
    }

    // Generate last 91 days
    const days: (ActivityDay & { col: number; row: number })[] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - DAYS_TO_SHOW + 1);

    // Align to start of week (Monday)
    const startDay = startDate.getDay();
    const mondayOffset = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - mondayOffset);

    const totalDays = DAYS_TO_SHOW + mondayOffset;
    const numWeeks = Math.ceil(totalDays / 7);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0] as string;
      const col = Math.floor(i / 7);
      const row = i % 7;

      const existing = dataMap.get(dateStr);
      days.push({
        date: dateStr,
        count: existing?.count ?? 0,
        xp: existing?.xp ?? 0,
        col,
        row,
      });
    }

    // Extract month labels
    const monthLabels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    for (const day of days) {
      const month = new Date(day.date).getMonth();
      if (month !== lastMonth && day.row === 0) {
        monthLabels.push({
          label: new Date(day.date).toLocaleDateString("fr-FR", { month: "short" }),
          col: day.col,
        });
        lastMonth = month;
      }
    }

    return { grid: days, months: monthLabels, numWeeks };
  }, [activityData]);

  const svgWidth = Math.ceil(DAYS_TO_SHOW / 7 + 2) * (CELL_SIZE + CELL_GAP) + 20;
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 24;

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block"
        >
          {/* Month labels */}
          {months.map((m, i) => (
            <text
              key={i}
              x={m.col * (CELL_SIZE + CELL_GAP)}
              y={10}
              className="text-[10px] fill-[#64748b]"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9 }}
            >
              {m.label}
            </text>
          ))}

          {/* Day cells */}
          {grid.map((day, i) => (
            <rect
              key={i}
              x={day.col * (CELL_SIZE + CELL_GAP)}
              y={day.row * (CELL_SIZE + CELL_GAP) + 16}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={COLORS[getIntensity(day.count)]}
              className="transition-colors cursor-pointer"
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ x: rect.left + rect.width / 2, y: rect.top, data: day });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[10px] text-[#94a3b8]">Moins</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <div
            key={level}
            className="w-[10px] h-[10px] rounded-sm"
            style={{ backgroundColor: COLORS[level] }}
          />
        ))}
        <span className="text-[10px] text-[#94a3b8]">Plus</span>
      </div>

      {/* Tooltip (portal-like fixed position) */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-[#0f172a] rounded-lg shadow-lg animate-fade-in pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs text-white font-medium">
            {formatTooltipDate(tooltip.data.date)}
          </p>
          <p className="text-[10px] text-[#94a3b8]">
            {tooltip.data.count} action{tooltip.data.count !== 1 ? "s" : ""}
            {tooltip.data.xp > 0 && ` \u00B7 ${tooltip.data.xp} XP`}
          </p>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0f172a] rotate-45" />
        </div>
      )}
    </div>
  );
}

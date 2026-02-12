import { InlineFormat } from "./InlineFormat"

export function KeyPoints({ points, color }: { points: string[]; color: string }) {
  return (
    <div className="p-5 rounded-2xl border" style={{ background: `linear-gradient(135deg, ${color}08, ${color}15)`, borderColor: `${color}25` }}>
      <div className="flex items-center gap-2 mb-3.5 font-bold text-sm uppercase tracking-wide" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5">
          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
        </svg>
        À retenir
      </div>
      <div className="flex flex-col gap-2">
        {points.map((point, i) => (
          <div key={i} className="flex gap-2.5 items-start text-sm leading-6 text-slate-700">
            <span className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold text-white mt-0.5" style={{ background: color }}>
              {i + 1}
            </span>
            <span className="flex-1"><InlineFormat text={point} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}
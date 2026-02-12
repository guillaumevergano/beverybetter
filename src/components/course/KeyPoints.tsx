interface KeyPointsProps {
  points: string[];
}

export function KeyPoints({ points }: KeyPointsProps) {
  return (
    <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-[20px] p-6">
      <h3
        className="text-lg font-bold text-[#1e40af] mb-4"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Points clés
      </h3>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[#1e3a5f]">
            <span className="text-[#0070f3] mt-0.5 shrink-0">&#10003;</span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface QCMQuestionProps {
  question: string;
  current: number;
  total: number;
}

export function QCMQuestion({ question, current, total }: QCMQuestionProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-[#64748b] bg-[#f1f5f9] px-3 py-1 rounded-full">
          Question {current}/{total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < current ? "bg-[#0070f3]" : "bg-[#e2e8f0]"
              }`}
            />
          ))}
        </div>
      </div>
      <h2
        className="text-lg font-bold text-[#0f172a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {question}
      </h2>
    </div>
  );
}

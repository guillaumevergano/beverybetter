interface QCMResultProps {
  explanation: string;
  isCorrect: boolean;
}

export function QCMResult({ explanation, isCorrect }: QCMResultProps) {
  return (
    <div
      className={`mt-4 p-4 rounded-[12px] text-sm animate-fade-in ${
        isCorrect
          ? "bg-[#d1fae5] border border-[#a7f3d0] text-[#065f46]"
          : "bg-[#fee2e2] border border-[#fecaca] text-[#991b1b]"
      }`}
    >
      <p className="font-semibold mb-1">
        {isCorrect ? "Bonne réponse !" : "Mauvaise réponse"}
      </p>
      <p>{explanation}</p>
    </div>
  );
}

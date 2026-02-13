"use client";

import { Button } from "@/components/ui/Button";

export default function InviteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc]">
      <h2
        className="text-xl font-bold text-[#0f172a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Une erreur est survenue
      </h2>
      <p className="text-sm text-[#64748b]">{error.message}</p>
      <Button onClick={reset}>Reessayer</Button>
    </div>
  );
}

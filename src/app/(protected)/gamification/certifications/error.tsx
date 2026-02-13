"use client";

import { Button } from "@/components/ui/Button";

export default function CertificationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2
        className="text-xl font-bold text-[#0f172a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Une erreur est survenue
      </h2>
      <p className="text-sm text-[#64748b]">{error.message}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}

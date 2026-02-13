"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2
            className="text-xl font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Une erreur est survenue
          </h2>
          <p className="text-sm text-[#64748b]">{error.message}</p>
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white bg-[#0070f3] hover:bg-[#005ec4] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}

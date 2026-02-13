import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2
        className="text-4xl font-bold text-[#0f172a]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        404
      </h2>
      <p className="text-[#64748b]">Cette page n&apos;existe pas.</p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-[12px] text-sm font-semibold text-white bg-[#0070f3] hover:bg-[#005ec4] transition-colors"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}

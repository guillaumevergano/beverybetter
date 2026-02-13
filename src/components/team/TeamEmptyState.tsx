"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function TeamEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[#f1f5f9] flex items-center justify-center text-4xl">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      </div>
      <div>
        <h2
          className="text-xl font-bold text-[#0f172a] mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Pas encore d&apos;equipe
        </h2>
        <p className="text-sm text-[#64748b] max-w-sm">
          Cree ta propre equipe ou rejoins-en une avec un code d&apos;invitation pour
          suivre la progression de tes coequipiers.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/team/create">
          <Button>Creer une equipe</Button>
        </Link>
      </div>
    </div>
  );
}

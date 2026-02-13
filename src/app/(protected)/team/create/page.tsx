import Link from "next/link";
import { TeamCreateForm } from "@/components/team/TeamCreateForm";

export default function TeamCreatePage() {
  return (
    <div className="max-w-md mx-auto">
      <Link
        href="/team"
        className="inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Retour
      </Link>

      <h1
        className="text-2xl font-bold text-[#0f172a] mb-6"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Creer une equipe
      </h1>

      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-8">
        <TeamCreateForm />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExamPlayer } from "@/components/course/ExamPlayer";
import type { Technology, Chapter, UserProgress } from "@/types";

interface PageProps {
  params: Promise<{ techId: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const { techId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tech }, { data: chaptersData }, { data: progressData }] =
    await Promise.all([
      supabase.from("technologies").select("*").eq("id", techId).single(),
      supabase.from("chapters").select("*").eq("tech_id", techId).order("display_order"),
      supabase.from("user_progress").select("*").eq("user_id", user!.id),
    ]);

  if (!tech) notFound();
  const typedTech = tech as Technology;
  const chapters = (chaptersData ?? []) as Chapter[];
  const progress = (progressData ?? []) as UserProgress[];
  const progressMap = new Map(progress.map((p) => [p.chapter_id, p]));

  // Check prerequisites
  const chaptersIncomplete = chapters.filter((c) => {
    const prog = progressMap.get(c.id);
    return !prog || !prog.completed;
  });

  const scores = chapters
    .map((c) => progressMap.get(c.id)?.best_score)
    .filter((s): s is number => s !== null && s !== undefined);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 20)
    : 0;

  // Check weekly attempts
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: recentAttempts } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("user_id", user!.id)
    .eq("technology_id", techId)
    .gte("completed_at", oneWeekAgo.toISOString());
  const attemptsThisWeek = (recentAttempts ?? []).length;

  // Check if already certified
  const { data: existingCert } = await supabase
    .from("user_certifications")
    .select("*")
    .eq("user_id", user!.id)
    .eq("technology_id", techId)
    .maybeSingle();

  const prerequisitesMet =
    chaptersIncomplete.length === 0 && avgScore >= 80 && attemptsThisWeek < 3;

  // Already certified
  if (existingCert) {
    const cert = existingCert as { cert_number: string; mention: string; score: number; total: number; certified_at: string };
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
        <div className="text-6xl">🎓</div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Déjà certifié en {typedTech.name} !
        </h1>
        <p className="text-[#64748b]">
          Mention : <strong>{cert.mention}</strong> — Score : {cert.score}/{cert.total}
        </p>
        <div className="flex justify-center gap-3">
          <Link
            href={`/api/certificate/${cert.cert_number}`}
            target="_blank"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0070f3] hover:opacity-90 transition-all"
          >
            Télécharger le PDF
          </Link>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] transition-all"
          >
            Mon profil
          </Link>
        </div>
      </div>
    );
  }

  // Prerequisites not met
  if (!prerequisitesMet) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href={`/learn/${techId}`}
            className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
        </div>

        <div className="text-center space-y-3">
          <div className="text-4xl">🔒</div>
          <h1
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Certification {typedTech.name}
          </h1>
          <p className="text-[#64748b]">
            Remplis les conditions ci-dessous pour accéder à l&apos;examen.
          </p>
        </div>

        <div className="space-y-4">
          {/* Chapters completion */}
          <PrerequisiteItem
            met={chaptersIncomplete.length === 0}
            label={`Tous les chapitres terminés (${chapters.length - chaptersIncomplete.length}/${chapters.length})`}
          >
            {chaptersIncomplete.length > 0 && (
              <div className="mt-2 space-y-1">
                {chaptersIncomplete.map((ch) => (
                  <Link
                    key={ch.id}
                    href={`/learn/${techId}/${ch.id}`}
                    className="block text-xs text-[#0070f3] hover:underline"
                  >
                    → {ch.title}
                  </Link>
                ))}
              </div>
            )}
          </PrerequisiteItem>

          {/* Average score */}
          <PrerequisiteItem
            met={avgScore >= 80}
            label={`Score moyen ≥ 80% (actuellement ${avgScore}%)`}
          />

          {/* Weekly attempts */}
          <PrerequisiteItem
            met={attemptsThisWeek < 3}
            label={`Moins de 3 tentatives cette semaine (${attemptsThisWeek}/3)`}
          />
        </div>
      </div>
    );
  }

  // Prerequisites met → show ExamPlayer
  return (
    <div className="max-w-3xl mx-auto">
      <div className="sticky top-0 z-40 bg-[#f8fafc]/95 backdrop-blur-sm -mx-4 px-4 pt-4 pb-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-3">
          <span className="text-xl">{typedTech.icon}</span>
          <div className="flex-1 min-w-0">
            <h1
              className="text-lg font-bold text-[#0f172a] truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Certification {typedTech.name}
            </h1>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-semibold">
            🎓 Examen
          </span>
        </div>
      </div>

      <div className="mt-6 mb-8">
        <ExamPlayer
          techId={techId}
          techColor={typedTech.color}
          techName={typedTech.name}
        />
      </div>
    </div>
  );
}

function PrerequisiteItem({
  met,
  label,
  children,
}: {
  met: boolean;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`p-4 rounded-2xl border-2 ${met ? "border-[#10b981] bg-[#f0fdf4]" : "border-[#e2e8f0] bg-white"}`}>
      <div className="flex items-center gap-3">
        <span
          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            met ? "bg-[#10b981]" : "bg-[#94a3b8]"
          }`}
        >
          {met ? "✓" : "✗"}
        </span>
        <span className={`text-sm font-medium ${met ? "text-[#065f46]" : "text-[#0f172a]"}`}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

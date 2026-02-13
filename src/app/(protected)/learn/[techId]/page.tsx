import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { calcPercent } from "@/lib/utils";
import type { Technology, Chapter, UserProgress, ChapterLevel, UserCertification } from "@/types";

interface PageProps {
  params: Promise<{ techId: string }>;
}

export default async function TechChaptersPage({ params }: PageProps) {
  const { techId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tech }, { data: chapters }, { data: progressData }, { data: certData }] =
    await Promise.all([
      supabase.from("technologies").select("*").eq("id", techId).single(),
      supabase
        .from("chapters")
        .select("*")
        .eq("tech_id", techId)
        .order("display_order"),
      supabase.from("user_progress").select("*").eq("user_id", user!.id),
      supabase
        .from("user_certifications")
        .select("*")
        .eq("user_id", user!.id)
        .eq("technology_id", techId)
        .maybeSingle(),
    ]);

  if (!tech) notFound();

  const typedTech = tech as Technology;
  const typedChapters = (chapters ?? []) as Chapter[];
  const certification = certData as UserCertification | null;

  const progressMap = new Map<string, UserProgress>();
  (progressData as UserProgress[] | null)?.forEach((p) =>
    progressMap.set(p.chapter_id, p)
  );

  const completedCount = typedChapters.filter(
    (c) => progressMap.get(c.id)?.completed
  ).length;
  const allCompleted = completedCount === typedChapters.length && typedChapters.length > 0;
  const percentage = calcPercent(completedCount, typedChapters.length);

  // Calculate average score for exam readiness
  const scores = typedChapters
    .map((c) => progressMap.get(c.id)?.best_score)
    .filter((s): s is number => s !== null && s !== undefined);
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 20)
    : 0;

  return (
    <div className="space-y-8">
      {/* Tech header */}
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-[16px] flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${typedTech.color}15` }}
        >
          {typedTech.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1
              className="text-2xl font-bold text-[#0f172a]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {typedTech.name}
            </h1>
            {certification && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                🎓 Certifié
              </span>
            )}
          </div>
          <p className="text-sm text-[#64748b]">
            {completedCount}/{typedChapters.length} chapitres — {percentage}%
          </p>
        </div>
      </div>

      {/* Certification banner */}
      {certification && (
        <div
          className="rounded-2xl border-2 p-5"
          style={{ borderColor: typedTech.color, backgroundColor: `${typedTech.color}08` }}
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎓</div>
            <div className="flex-1">
              <p
                className="font-bold text-[#0f172a]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Certification {typedTech.name} obtenue
              </p>
              <p className="text-sm text-[#64748b]">
                Mention : <strong>{certification.mention}</strong> — Score : {certification.score}/{certification.total}
              </p>
              <p className="text-xs text-[#94a3b8] mt-1">
                N° {certification.cert_number}
              </p>
            </div>
            <Link
              href={`/api/certificate/${certification.cert_number}`}
              target="_blank"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shrink-0"
              style={{ backgroundColor: typedTech.color }}
            >
              Voir le certificat
            </Link>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: typedTech.accent }}
        />
      </div>

      {/* Chapter list */}
      <div className="space-y-4">
        {typedChapters.map((chapter, i) => {
          const prog = progressMap.get(chapter.id);
          const isCompleted = prog?.completed ?? false;

          return (
            <Link key={chapter.id} href={`/learn/${techId}/${chapter.id}`}>
              <Card hover className="flex items-center gap-4 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    backgroundColor: isCompleted ? "#d1fae5" : "#f1f5f9",
                    color: isCompleted ? "#065f46" : "#64748b",
                  }}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#0f172a] truncate">
                      {chapter.title}
                    </h3>
                    <Badge level={chapter.level as ChapterLevel} />
                  </div>
                  <p className="text-sm text-[#64748b] truncate">
                    {chapter.description}
                  </p>
                </div>
                {prog && prog.best_score !== null && (
                  <span className="text-xs font-semibold text-[#64748b] bg-[#f1f5f9] px-2 py-1 rounded-full shrink-0">
                    Best: {prog.best_score}/{5}
                  </span>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Exam CTA */}
      {!certification && (
        <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-4xl">🎓</div>
            <div className="flex-1 text-center sm:text-left">
              <h3
                className="text-lg font-bold text-[#0f172a]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Certification {typedTech.name}
              </h3>
              {allCompleted && avgScore >= 80 ? (
                <p className="text-sm text-[#10b981] font-medium">
                  Tu remplis les conditions ! Passe l&apos;examen final.
                </p>
              ) : (
                <p className="text-sm text-[#64748b]">
                  Termine tous les chapitres avec un score moyen ≥ 80% pour débloquer l&apos;examen.
                  {!allCompleted && ` (${completedCount}/${typedChapters.length} chapitres)`}
                  {allCompleted && avgScore < 80 && ` (Score moyen : ${avgScore}%)`}
                </p>
              )}
            </div>
            <Link
              href={`/learn/${techId}/exam`}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                allCompleted && avgScore >= 80
                  ? "text-white hover:opacity-90 hover:shadow-lg"
                  : "text-[#94a3b8] bg-[#f1f5f9] cursor-default pointer-events-none"
              }`}
              style={{
                backgroundColor: allCompleted && avgScore >= 80 ? typedTech.color : undefined,
              }}
            >
              Passer l&apos;examen
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

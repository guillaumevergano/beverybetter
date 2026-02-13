import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcPercent } from "@/lib/utils";
import type { Technology, Chapter, UserProgress, UserCertification, ExamAttempt } from "@/types";

export default async function CertificationsDetailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: techsData },
    { data: chaptersData },
    { data: progressData },
    { data: certsData },
    { data: attemptsData },
  ] = await Promise.all([
    supabase.from("technologies").select("*").order("display_order"),
    supabase.from("chapters").select("*").order("display_order"),
    supabase.from("user_progress").select("*").eq("user_id", user!.id),
    supabase.from("user_certifications").select("*").eq("user_id", user!.id),
    supabase.from("exam_attempts").select("*").eq("user_id", user!.id).order("completed_at", { ascending: false }),
  ]);

  const techs = (techsData ?? []) as Technology[];
  const chapters = (chaptersData ?? []) as Chapter[];
  const progress = (progressData ?? []) as UserProgress[];
  const certs = (certsData ?? []) as UserCertification[];
  const attempts = (attemptsData ?? []) as ExamAttempt[];

  const progressMap = new Map(progress.map((p) => [p.chapter_id, p]));
  const certMap = new Map(certs.map((c) => [c.technology_id, c]));
  const attemptsByTech = new Map<string, ExamAttempt[]>();
  for (const a of attempts) {
    const arr = attemptsByTech.get(a.technology_id) ?? [];
    arr.push(a);
    attemptsByTech.set(a.technology_id, arr);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-4xl">🎓</div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Certifications
        </h1>
        <p className="text-[#64748b]">
          {certs.length} / {techs.length} obtenues
        </p>
      </div>

      {/* Per tech */}
      {techs.map((tech) => {
        const techChapters = chapters.filter((c) => c.tech_id === tech.id);
        const completedCount = techChapters.filter((c) => progressMap.get(c.id)?.completed).length;
        const allCompleted = completedCount === techChapters.length && techChapters.length > 0;
        const completionPct = calcPercent(completedCount, techChapters.length);

        const scores = techChapters
          .map((c) => progressMap.get(c.id)?.best_score)
          .filter((s): s is number => s !== null && s !== undefined);
        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 20)
          : 0;

        const cert = certMap.get(tech.id);
        const techAttempts = attemptsByTech.get(tech.id) ?? [];

        // Weekly attempt count
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyAttempts = techAttempts.filter(
          (a) => new Date(a.completed_at) >= oneWeekAgo
        ).length;

        return (
          <div
            key={tech.id}
            className={`bg-white rounded-[20px] border-2 p-6 ${
              cert ? "border-[#10b981]" : "border-[#e2e8f0]"
            }`}
          >
            {/* Tech header */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl"
                style={{ backgroundColor: `${tech.color}15` }}
              >
                {tech.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2
                    className="text-lg font-bold text-[#0f172a]"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {tech.name}
                  </h2>
                  {cert && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold">
                      ✓ Certifié
                    </span>
                  )}
                </div>
                {cert ? (
                  <p className="text-sm text-[#64748b]">
                    Mention : <strong>{cert.mention}</strong> — {cert.score}/{cert.total}
                  </p>
                ) : (
                  <p className="text-sm text-[#64748b]">
                    Examen final : 15 questions, 20 min, 70% pour valider
                  </p>
                )}
              </div>
            </div>

            {cert ? (
              <>
                {/* Certified view */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f0fdf4] mb-4">
                  <span className="text-3xl">🎓</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#065f46]">
                      Certification obtenue
                    </p>
                    <p className="text-xs text-[#64748b]">
                      N° {cert.cert_number} — {new Date(cert.certified_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/api/certificate/${cert.cert_number}`}
                    target="_blank"
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: tech.color }}
                  >
                    Voir le PDF
                  </Link>
                </div>
              </>
            ) : (
              <>
                {/* Prerequisites */}
                <div className="space-y-3">
                  <PrereqItem
                    met={allCompleted}
                    label={`Chapitres terminés : ${completedCount}/${techChapters.length}`}
                    progressPct={completionPct}
                    color={tech.accent}
                  />
                  <PrereqItem
                    met={avgScore >= 80}
                    label={`Score moyen ≥ 80% (actuellement ${avgScore}%)`}
                    progressPct={Math.min(avgScore, 100)}
                    color={tech.accent}
                  />
                  <PrereqItem
                    met={weeklyAttempts < 3}
                    label={`Tentatives cette semaine : ${weeklyAttempts}/3`}
                    progressPct={0}
                    color={tech.accent}
                    noBar
                  />
                </div>

                {/* CTA */}
                <div className="mt-5">
                  {allCompleted && avgScore >= 80 && weeklyAttempts < 3 ? (
                    <Link
                      href={`/learn/${tech.id}/exam`}
                      className="block w-full py-3 rounded-xl text-center text-white text-sm font-semibold transition-all hover:opacity-90"
                      style={{ backgroundColor: tech.color }}
                    >
                      Passer l&apos;examen
                    </Link>
                  ) : (
                    <div className="w-full py-3 rounded-xl text-center text-[#94a3b8] text-sm font-semibold bg-[#f1f5f9]">
                      Prérequis non remplis
                    </div>
                  )}
                </div>

                {/* Past attempts */}
                {techAttempts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                    <p className="text-xs font-semibold text-[#64748b] mb-2">
                      Tentatives précédentes
                    </p>
                    {techAttempts.slice(0, 5).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 py-1.5">
                        <span className={`text-xs font-bold ${a.passed ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                          {a.passed ? "✓" : "✗"}
                        </span>
                        <span className="text-xs text-[#0f172a]">
                          {a.score}/{a.total}
                        </span>
                        <span className="text-[10px] text-[#94a3b8]">
                          {new Date(a.completed_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* How certification works */}
      <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-6">
        <h2 className="text-lg font-bold text-[#0f172a] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Comment ça marche
        </h2>
        <div className="space-y-3">
          {[
            { icon: "📖", text: "Termine tous les chapitres d'une technologie." },
            { icon: "🎯", text: "Obtiens un score moyen ≥ 80% aux QCM." },
            { icon: "📝", text: "Passe l'examen final : 15 questions en 20 minutes." },
            { icon: "🏆", text: "Score ≥ 70% pour obtenir la certification." },
            { icon: "⭐", text: "Mentions : Bien (70%), Très Bien (85%), Exceptionnelle (95%)." },
            { icon: "🔄", text: "3 tentatives maximum par semaine et par technologie." },
            { icon: "🎓", text: "Certification vérifiable avec un numéro unique + 300 XP bonus." },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#f8fafc]">
              <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
              <p className="text-sm text-[#0f172a]">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrereqItem({
  met,
  label,
  progressPct,
  color,
  noBar,
}: {
  met: boolean;
  label: string;
  progressPct: number;
  color: string;
  noBar?: boolean;
}) {
  return (
    <div className={`p-3 rounded-xl ${met ? "bg-[#f0fdf4]" : "bg-[#f8fafc]"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
            met ? "bg-[#10b981]" : "bg-[#94a3b8]"
          }`}
        >
          {met ? "✓" : "✗"}
        </span>
        <span className={`text-xs font-medium ${met ? "text-[#065f46]" : "text-[#0f172a]"}`}>
          {label}
        </span>
      </div>
      {!met && !noBar && (
        <div className="ml-7 w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${progressPct}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  );
}

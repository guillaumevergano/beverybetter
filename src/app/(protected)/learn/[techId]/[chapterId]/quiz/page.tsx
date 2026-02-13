import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { QuizPlayer } from "@/components/course/QuizPlayer";
import { Badge } from "@/components/ui/Badge";
import type { Technology, Chapter, QCMQuestion, GeneratedContent, ChapterLevel } from "@/types";

interface PageProps {
  params: Promise<{ techId: string; chapterId: string }>;
}

export default async function QuizPage({ params }: PageProps) {
  const { techId, chapterId } = await params;
  const supabase = await createClient();

  const [{ data: tech }, { data: chapter }, { data: content }] = await Promise.all([
    supabase.from("technologies").select("*").eq("id", techId).single(),
    supabase.from("chapters").select("*").eq("id", chapterId).single(),
    supabase
      .from("generated_content")
      .select("*")
      .eq("chapter_id", chapterId)
      .eq("content_type", "qcm")
      .single(),
  ]);

  if (!tech || !chapter) notFound();

  const typedTech = tech as Technology;
  const typedChapter = chapter as Chapter;

  // Next chapter for "Chapitre suivant" button
  const { data: nextChapter } = await supabase
    .from("chapters")
    .select("id")
    .eq("tech_id", techId)
    .gt("display_order", typedChapter.display_order)
    .order("display_order", { ascending: true })
    .limit(1)
    .single();

  const nextChapterUrl = nextChapter ? `/learn/${techId}/${nextChapter.id}` : null;

  // QCM not yet available
  if (!content) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="text-4xl">📝</div>
        <h2
          className="text-xl font-bold text-slate-900"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          QCM en cours de préparation
        </h2>
        <p className="text-sm text-slate-500">
          Le QCM pour ce chapitre n&apos;est pas encore disponible. Reviens bientôt !
        </p>
        <Link
          href={`/learn/${techId}/${chapterId}`}
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: typedTech.color }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour au cours
        </Link>
      </div>
    );
  }

  const questions = (content as GeneratedContent).content as QCMQuestion[];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-[#f8fafc]/95 backdrop-blur-sm -mx-4 px-4 pt-4 pb-3 border-b border-slate-100">
        <Link
          href={`/learn/${techId}/${chapterId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour au cours
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xl">{typedTech.icon}</span>
          <div className="flex-1 min-w-0">
            <h1
              className="text-lg font-bold text-slate-900 truncate"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {typedChapter.title}
            </h1>
          </div>
          <Badge level={typedChapter.level as ChapterLevel} />
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-xs font-semibold">
            📝 QCM
          </span>
        </div>
      </div>

      {/* Quiz */}
      <div className="mt-6 mb-8">
        <QuizPlayer
          questions={questions}
          techColor={typedTech.color}
          chapterId={chapterId}
          techId={techId}
          nextChapterUrl={nextChapterUrl}
        />
      </div>
    </div>
  );
}

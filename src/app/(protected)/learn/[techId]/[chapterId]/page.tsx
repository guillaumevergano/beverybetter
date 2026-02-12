import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseAccordion } from "@/components/course/CourseAccordion";
import { KeyPoints } from "@/components/course/KeyPoints";
import { Badge } from "@/components/ui/Badge";
import type { Technology, Chapter, CourseContent, GeneratedContent, ChapterLevel } from "@/types";

interface PageProps {
  params: Promise<{ techId: string; chapterId: string }>;
}

export default async function ChapterCoursePage({ params }: PageProps) {
  const { techId, chapterId } = await params;
  const supabase = await createClient();

  const [{ data: tech }, { data: chapter }, { data: content }] = await Promise.all([
    supabase.from("technologies").select("*").eq("id", techId).single(),
    supabase.from("chapters").select("*").eq("id", chapterId).single(),
    supabase
      .from("generated_content")
      .select("*")
      .eq("chapter_id", chapterId)
      .eq("content_type", "course")
      .single(),
  ]);

  if (!tech || !chapter) notFound();

  const typedTech = tech as Technology;
  const typedChapter = chapter as Chapter;

  // Contenu pas encore disponible
  if (!content) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="text-4xl">📝</div>
        <h2
          className="text-xl font-bold text-slate-900"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Contenu en cours de préparation
        </h2>
        <p className="text-sm text-slate-500">
          Le cours pour ce chapitre n&apos;est pas encore disponible. Reviens bientôt !
        </p>
        <Link
          href={`/learn/${techId}`}
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ backgroundColor: typedTech.color }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour aux chapitres
        </Link>
      </div>
    );
  }

  const course = (content as GeneratedContent).content as CourseContent;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#f8fafc]/95 backdrop-blur-sm -mx-4 px-4 pt-4 pb-3 border-b border-slate-100">
        <Link
          href={`/learn/${techId}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {typedTech.name}
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold">
            📖 Cours
          </span>
        </div>
      </div>

      {/* Course accordion */}
      <div className="mt-6">
        <CourseAccordion sections={course.sections} techColor={typedTech.color} />
      </div>

      {/* Key Points */}
      <div id="key-points" className="scroll-mt-20 mt-8">
        <KeyPoints points={course.keyPoints} color={typedTech.color} />
      </div>

      {/* CTA → QCM */}
      <div className="mt-8 mb-4">
        <Link href={`/qcm/${techId}/${chapterId}`} className="block">
          <div
            className="w-full py-4 rounded-2xl text-center text-white font-bold text-base transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg, ${typedTech.color}, ${typedTech.accent})`,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Passer le QCM →
          </div>
        </Link>
      </div>
    </div>
  );
}

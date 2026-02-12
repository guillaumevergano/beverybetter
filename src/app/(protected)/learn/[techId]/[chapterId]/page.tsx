import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseContent } from "@/components/course/CourseContent";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Technology, Chapter, CourseContent as CourseContentType, GeneratedContent, ChapterLevel } from "@/types";

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
  if (!content) notFound();

  const typedTech = tech as Technology;
  const typedChapter = chapter as Chapter;
  const course = (content as GeneratedContent).content as CourseContentType;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Link
          href={`/learn/${techId}`}
          className="text-sm text-[#64748b] hover:text-[#0070f3] transition-colors"
        >
          &larr; Retour aux chapitres
        </Link>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-2xl">{typedTech.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-2xl font-bold text-[#0f172a]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {typedChapter.title}
              </h1>
              <Badge level={typedChapter.level as ChapterLevel} />
            </div>
            <p className="text-sm text-[#64748b] mt-1">
              {typedChapter.description}
            </p>
          </div>
        </div>
      </div>

      <CourseContent course={course} />

      <div className="flex justify-center pt-4">
        <Link href={`/qcm/${techId}/${chapterId}`}>
          <Button size="lg">Passer le QCM</Button>
        </Link>
      </div>
    </div>
  );
}

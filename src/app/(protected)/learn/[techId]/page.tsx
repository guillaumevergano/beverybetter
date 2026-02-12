import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Technology, Chapter, UserProgress, ChapterLevel } from "@/types";

interface PageProps {
  params: Promise<{ techId: string }>;
}

export default async function TechChaptersPage({ params }: PageProps) {
  const { techId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: tech }, { data: chapters }, { data: progressData }] =
    await Promise.all([
      supabase.from("technologies").select("*").eq("id", techId).single(),
      supabase
        .from("chapters")
        .select("*")
        .eq("tech_id", techId)
        .order("display_order"),
      supabase.from("user_progress").select("*").eq("user_id", user!.id),
    ]);

  if (!tech) notFound();

  const typedTech = tech as Technology;
  const typedChapters = (chapters ?? []) as Chapter[];

  const progressMap = new Map<string, UserProgress>();
  (progressData as UserProgress[] | null)?.forEach((p) =>
    progressMap.set(p.chapter_id, p)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-[16px] flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${typedTech.color}15` }}
        >
          {typedTech.icon}
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {typedTech.name}
          </h1>
          <p className="text-sm text-[#64748b]">
            {typedChapters.length} chapitres
          </p>
        </div>
      </div>

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
    </div>
  );
}

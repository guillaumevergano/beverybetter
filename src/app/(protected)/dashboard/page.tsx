import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatXP, calcPercent } from "@/lib/utils";
import type { Technology, Chapter, UserProgress } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: technologies },
    { data: chapters },
    { data: progressData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("technologies").select("*").order("display_order"),
    supabase.from("chapters").select("*").order("display_order"),
    supabase.from("user_progress").select("*").eq("user_id", user!.id),
  ]);

  const progressMap = new Map<string, UserProgress>();
  (progressData as UserProgress[] | null)?.forEach((p) =>
    progressMap.set(p.chapter_id, p)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Salut, {profile?.pseudo ?? "Utilisateur"} !
        </h1>
        <p className="text-[#64748b] mt-1">
          Continue ta progression — {formatXP(profile?.xp_total ?? 0)} au total
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(technologies as Technology[] | null)?.map((tech) => {
          const techChapters = (chapters as Chapter[] | null)?.filter(
            (c) => c.tech_id === tech.id
          ) ?? [];
          const completedCount = techChapters.filter(
            (c) => progressMap.get(c.id)?.completed
          ).length;
          const percentage = calcPercent(completedCount, techChapters.length);

          return (
            <Link key={tech.id} href={`/learn/${tech.id}`}>
              <Card hover>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-[16px] flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${tech.color}15` }}
                    >
                      {tech.icon}
                    </div>
                    <div>
                      <h2
                        className="text-lg font-bold text-[#0f172a]"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {tech.name}
                      </h2>
                      <p className="text-sm text-[#64748b]">
                        {completedCount}/{techChapters.length} chapitres
                      </p>
                    </div>
                  </div>
                  <ProgressRing
                    percentage={percentage}
                    color={tech.accent}
                  />
                </div>

                <div className="mt-4 w-full bg-[#e2e8f0] rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: tech.accent,
                    }}
                  />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthProvider } from "@/hooks/useAuth";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { getUserStats } from "@/lib/gamification";
import type { TeamRole } from "@/types";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch profile + team membership + stats in parallel
  const [profileRes, membershipRes, statsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("team_members").select("team_id, role").eq("user_id", user.id).maybeSingle(),
    getUserStats(supabase, user.id).catch(() => null),
  ]);

  const profile = profileRes.data;
  const membership = membershipRes.data;

  let initialTeam = null;
  if (membership) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, invite_code")
      .eq("id", membership.team_id)
      .single();

    if (teamData) {
      initialTeam = {
        id: teamData.id,
        name: teamData.name,
        invite_code: teamData.invite_code,
        role: membership.role as TeamRole,
      };
    }
  }

  return (
    <AuthProvider initialUser={user} initialProfile={profile} initialTeam={initialTeam}>
      <GamificationProvider initialStats={statsResult}>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <MobileNav />
      </GamificationProvider>
    </AuthProvider>
  );
}

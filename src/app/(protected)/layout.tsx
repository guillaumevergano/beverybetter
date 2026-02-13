import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { AuthProvider } from "@/hooks/useAuth";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { getUserStats } from "@/lib/gamification";

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

  // Fetch profile server-side so it's available immediately (no client-side loading)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  let initialStats = null;
  try {
    initialStats = await getUserStats(supabase, user.id);
  } catch {
    // Gamification tables may not exist yet — graceful fallback
  }

  return (
    <AuthProvider initialUser={user} initialProfile={profile}>
      <GamificationProvider initialStats={initialStats}>
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
          {children}
        </main>
        <MobileNav />
      </GamificationProvider>
    </AuthProvider>
  );
}

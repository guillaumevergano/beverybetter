import { createClient } from "@/lib/supabase/server";
import { TeamJoinButton } from "@/components/team/TeamJoinButton";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const supabase = await createClient();

  // Verifier si l'utilisateur est connecte
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Trouver l'equipe par code
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, max_members")
    .eq("invite_code", code.toUpperCase())
    .maybeSingle();

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8fafc]">
        <div className="text-center">
          <h1
            className="text-2xl font-bold text-[#0f172a] mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Invitation invalide
          </h1>
          <p className="text-sm text-[#64748b] mb-6">
            Ce code d&apos;invitation n&apos;existe pas ou a expire.
          </p>
          <Link
            href="/"
            className="text-[#0070f3] font-medium hover:underline text-sm"
          >
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // Compter les membres
  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  const membersCount = count ?? 0;
  const isFull = membersCount >= team.max_members;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f8fafc]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold text-[#0f172a] mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <span className="text-[#0070f3]">B</span>e Very Better
          </h1>
          <p className="text-[#64748b]">Tu as ete invite a rejoindre une equipe</p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#e2e8f0] p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#eff6ff] flex items-center justify-center mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0070f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h2
              className="text-xl font-bold text-[#0f172a] mb-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {team.name}
            </h2>
            <p className="text-sm text-[#64748b]">
              {membersCount} membre{membersCount !== 1 ? "s" : ""} &middot; {team.max_members} max
            </p>
          </div>

          {isFull ? (
            <div className="bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] text-sm px-4 py-3 rounded-[12px] text-center">
              Cette equipe est pleine.
            </div>
          ) : user ? (
            <TeamJoinButton inviteCode={code} />
          ) : (
            <div className="space-y-3">
              <Link
                href={`/auth/login?invite=${code}`}
                className="block w-full px-5 py-2.5 text-center text-sm font-semibold rounded-[12px] bg-[#0070f3] text-white hover:bg-[#005bb5] transition-all"
              >
                Se connecter
              </Link>
              <Link
                href={`/auth/signup?invite=${code}`}
                className="block w-full px-5 py-2.5 text-center text-sm font-semibold rounded-[12px] bg-white text-[#0f172a] border border-[#e2e8f0] hover:bg-[#f1f5f9] transition-all"
              >
                Creer un compte
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { InviteContent } from "./InviteContent";
import Link from "next/link";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const supabase = await createClient();
  const serviceClient = await createServiceClient();

  // Verifier si l'utilisateur est connecte
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Chercher un parrain par code de parrainage (service client pour bypass RLS)
  const { data: referrer } = await serviceClient
    .from("profiles")
    .select("id, pseudo, avatar_url")
    .eq("referral_code", upperCode)
    .maybeSingle();

  if (referrer) {
    // Trouver l'equipe du parrain
    const { data: referrerMembership } = await serviceClient
      .from("team_members")
      .select("team_id")
      .eq("user_id", referrer.id)
      .maybeSingle();

    let teamName: string | null = null;
    let membersCount = 0;
    let maxMembers = 20;

    if (referrerMembership) {
      const { data: team } = await serviceClient
        .from("teams")
        .select("name, max_members")
        .eq("id", referrerMembership.team_id)
        .single();

      if (team) {
        teamName = team.name;
        maxMembers = team.max_members;
      }

      const { count } = await serviceClient
        .from("team_members")
        .select("*", { count: "exact", head: true })
        .eq("team_id", referrerMembership.team_id);

      membersCount = count ?? 0;
    }

    return (
      <InviteContent
        type="referral"
        code={code}
        isLoggedIn={!!user}
        referrerName={referrer.pseudo}
        referrerAvatar={referrer.avatar_url}
        teamName={teamName}
        membersCount={membersCount}
        maxMembers={maxMembers}
      />
    );
  }

  // 2. Chercher une equipe par code d'invitation (service client pour bypass RLS)
  const { data: team } = await serviceClient
    .from("teams")
    .select("id, name, max_members")
    .eq("invite_code", upperCode)
    .maybeSingle();

  if (team) {
    const { count } = await serviceClient
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id);

    return (
      <InviteContent
        type="team"
        code={code}
        isLoggedIn={!!user}
        teamName={team.name}
        membersCount={count ?? 0}
        maxMembers={team.max_members}
      />
    );
  }

  // 3. Aucun code valide
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
          Ce code d&apos;invitation n&apos;existe pas.
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

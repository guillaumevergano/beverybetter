"use server";

import { createClient } from "@/lib/supabase/server";
import { TEAM_NAME_MIN_LENGTH, TEAM_NAME_MAX_LENGTH } from "@/lib/constants";
import type { Team, TeamMemberStats, TeamRole } from "@/types";

// ============================================
// createTeamAction
// ============================================

export async function createTeamAction(
  name: string,
  description?: string
): Promise<{ success: boolean; data?: Team; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  const trimmed = name.trim();
  if (trimmed.length < TEAM_NAME_MIN_LENGTH || trimmed.length > TEAM_NAME_MAX_LENGTH) {
    return { success: false, error: `Le nom doit contenir entre ${TEAM_NAME_MIN_LENGTH} et ${TEAM_NAME_MAX_LENGTH} caracteres` };
  }

  // Verifier que l'user n'est pas deja dans une equipe
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return { success: false, error: "Tu es deja dans une equipe" };
  }

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      name: trimmed,
      description: description?.trim() ?? "",
      owner_id: user.id,
      invite_code: "PLACEHOLDER", // sera ecrase par le trigger
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: team };
}

// ============================================
// getMyTeamAction
// ============================================

export async function getMyTeamAction(): Promise<{
  success: boolean;
  data?: { team: Team; role: TeamRole; membersCount: number } | null;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { success: true, data: null };
  }

  const { data: team, error } = await supabase
    .from("teams")
    .select("*")
    .eq("id", membership.team_id)
    .single();

  if (error || !team) {
    return { success: false, error: "Equipe introuvable" };
  }

  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  return {
    success: true,
    data: {
      team,
      role: membership.role as TeamRole,
      membersCount: count ?? 0,
    },
  };
}

// ============================================
// getTeamByInviteCodeAction
// ============================================

export async function getTeamByInviteCodeAction(
  code: string
): Promise<{
  success: boolean;
  data?: { name: string; membersCount: number; maxMembers: number };
  error?: string;
}> {
  const supabase = await createClient();

  const { data: team, error } = await supabase
    .from("teams")
    .select("id, name, max_members")
    .eq("invite_code", code.toUpperCase())
    .maybeSingle();

  if (error || !team) {
    return { success: false, error: "Code d'invitation invalide" };
  }

  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  return {
    success: true,
    data: {
      name: team.name,
      membersCount: count ?? 0,
      maxMembers: team.max_members,
    },
  };
}

// ============================================
// joinTeamAction
// ============================================

export async function joinTeamAction(
  inviteCode: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  // Verifier que l'user n'est pas deja dans une equipe
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMember) {
    return { success: false, error: "Tu es deja dans une equipe" };
  }

  // Trouver l'equipe par code
  const { data: team } = await supabase
    .from("teams")
    .select("id, max_members")
    .eq("invite_code", inviteCode.toUpperCase())
    .maybeSingle();

  if (!team) {
    return { success: false, error: "Code d'invitation invalide" };
  }

  // Verifier que l'equipe n'est pas pleine
  const { count } = await supabase
    .from("team_members")
    .select("*", { count: "exact", head: true })
    .eq("team_id", team.id);

  if ((count ?? 0) >= team.max_members) {
    return { success: false, error: "Cette equipe est pleine" };
  }

  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "member" });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// leaveTeamAction
// ============================================

export async function leaveTeamAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { success: false, error: "Tu n'es dans aucune equipe" };
  }

  if (membership.role === "owner") {
    return { success: false, error: "Le proprietaire doit transferer la propriete ou dissoudre l'equipe" };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", membership.team_id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// kickMemberAction
// ============================================

export async function kickMemberAction(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  // Verifier que le caller est owner
  const { data: myMembership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership || myMembership.role !== "owner") {
    return { success: false, error: "Seul le proprietaire peut exclure un membre" };
  }

  if (userId === user.id) {
    return { success: false, error: "Tu ne peux pas t'exclure toi-meme" };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", myMembership.team_id)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// getTeamMembersAction
// ============================================

export async function getTeamMembersAction(): Promise<{
  success: boolean;
  data?: TeamMemberStats[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  const { data: myMembership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) {
    return { success: false, error: "Tu n'es dans aucune equipe" };
  }

  // Recuperer tous les membres
  const { data: members, error } = await supabase
    .from("team_members")
    .select("user_id, role, joined_at")
    .eq("team_id", myMembership.team_id);

  if (error || !members) {
    return { success: false, error: "Impossible de charger les membres" };
  }

  const userIds = members.map((m) => m.user_id);

  // Fetch toutes les donnees en parallele
  const [profilesRes, streaksRes, badgesRes, progressRes, certsRes] = await Promise.all([
    supabase.from("profiles").select("id, pseudo, avatar_url, xp_total, current_level, current_title").in("id", userIds),
    supabase.from("user_streaks").select("user_id, current_streak, longest_streak").in("user_id", userIds),
    supabase.from("user_badges").select("user_id").in("user_id", userIds),
    supabase.from("user_progress").select("user_id, completed").in("user_id", userIds).eq("completed", true),
    supabase.from("user_certifications").select("user_id").in("user_id", userIds),
  ]);

  const profiles = profilesRes.data ?? [];
  const streaks = streaksRes.data ?? [];
  const badges = badgesRes.data ?? [];
  const progress = progressRes.data ?? [];
  const certs = certsRes.data ?? [];

  const stats: TeamMemberStats[] = members.map((member) => {
    const profile = profiles.find((p) => p.id === member.user_id);
    const streak = streaks.find((s) => s.user_id === member.user_id);
    const badgeCount = badges.filter((b) => b.user_id === member.user_id).length;
    const coursesCompleted = progress.filter((p) => p.user_id === member.user_id).length;
    const certCount = certs.filter((c) => c.user_id === member.user_id).length;

    return {
      user_id: member.user_id,
      pseudo: profile?.pseudo ?? "Inconnu",
      avatar_url: profile?.avatar_url ?? null,
      role: member.role as TeamRole,
      joined_at: member.joined_at,
      xp_total: profile?.xp_total ?? 0,
      current_level: profile?.current_level ?? 1,
      current_title: profile?.current_title ?? "Debutant",
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      badges_count: badgeCount,
      courses_completed: coursesCompleted,
      certifications_count: certCount,
    };
  });

  // Trier par XP decroissant
  stats.sort((a, b) => b.xp_total - a.xp_total);

  return { success: true, data: stats };
}

// ============================================
// updateTeamAction
// ============================================

export async function updateTeamAction(
  name: string,
  description?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  const trimmed = name.trim();
  if (trimmed.length < TEAM_NAME_MIN_LENGTH || trimmed.length > TEAM_NAME_MAX_LENGTH) {
    return { success: false, error: `Le nom doit contenir entre ${TEAM_NAME_MIN_LENGTH} et ${TEAM_NAME_MAX_LENGTH} caracteres` };
  }

  const { error } = await supabase
    .from("teams")
    .update({ name: trimmed, description: description?.trim() ?? "" })
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// regenerateInviteCodeAction
// ============================================

export async function regenerateInviteCodeAction(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  // Generer un nouveau code cote serveur
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let newCode = "";
  for (let i = 0; i < 7; i++) {
    newCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const { error } = await supabase
    .from("teams")
    .update({ invite_code: newCode })
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: newCode };
}

// ============================================
// disbandTeamAction
// ============================================

export async function disbandTeamAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("owner_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// transferOwnershipAction
// ============================================

export async function transferOwnershipAction(
  newOwnerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifie" };
  }

  if (newOwnerId === user.id) {
    return { success: false, error: "Tu es deja le proprietaire" };
  }

  // Verifier que le caller est owner
  const { data: myMembership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership || myMembership.role !== "owner") {
    return { success: false, error: "Seul le proprietaire peut transferer" };
  }

  // Verifier que le nouveau owner est dans l'equipe
  const { data: targetMember } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", myMembership.team_id)
    .eq("user_id", newOwnerId)
    .maybeSingle();

  if (!targetMember) {
    return { success: false, error: "Ce membre n'est pas dans l'equipe" };
  }

  // Mettre a jour le owner de l'equipe
  const { error: teamError } = await supabase
    .from("teams")
    .update({ owner_id: newOwnerId })
    .eq("id", myMembership.team_id);

  if (teamError) {
    return { success: false, error: teamError.message };
  }

  // Mettre a jour les roles
  // L'ancien owner passe son role a owner -> member n'est pas possible via RLS update
  // On doit supprimer et re-inserer, ou bien on utilise un service client
  // Approche: on supprime les deux et on re-insere avec les bons roles
  // Mais la RLS ne permet pas UPDATE sur team_members
  // On utilise delete + insert (RLS permet delete self ou owner, insert self)

  // Supprimer les deux memberships
  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", myMembership.team_id)
    .eq("user_id", user.id);

  await supabase
    .from("team_members")
    .delete()
    .eq("team_id", myMembership.team_id)
    .eq("user_id", newOwnerId);

  // Re-inserer avec les bons roles
  // Le nouveau owner s'insere comme member d'abord (c'est ce que la RLS permet)
  // Mais on a un probleme: l'insert RLS exige role='member'
  // Solution: le caller (ancien owner, maintenant owner de l'equipe puisqu'on a deja update)
  // Ah non, l'equipe a deja ete mise a jour avec newOwnerId comme owner
  // Donc l'ancien owner ne peut plus gerer. On va plutot faire tout via une seule operation.

  // En fait, on vient de supprimer les membres, et on doit reconstruire
  // Le nouveau owner va s'inserer comme 'member' (c'est ce que la RLS permet)
  // mais on a besoin de mettre role='owner'. Le trigger AFTER INSERT on teams
  // ne s'execute qu'a la creation.

  // Approche simplifiee: on utilise le service client pour cette operation atomique
  const { createServiceClient } = await import("@/lib/supabase/server");
  const serviceClient = await createServiceClient();

  await serviceClient
    .from("team_members")
    .upsert([
      { team_id: myMembership.team_id, user_id: newOwnerId, role: "owner" },
      { team_id: myMembership.team_id, user_id: user.id, role: "member" },
    ]);

  return { success: true };
}

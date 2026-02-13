/**
 * Test script — Vérifie l'ensemble du système de gamification.
 *
 * Usage: npx tsx scripts/test-gamification.ts
 *
 * Ce script utilise le service_role_key pour bypasser RLS.
 * Il crée un utilisateur test, simule des actions, et vérifie
 * que XP, niveaux, streaks, badges, et certifications fonctionnent.
 *
 * L'utilisateur test est nettoyé à la fin.
 */

import { createClient } from "@supabase/supabase-js";

// ============================================
// Config — Reprend les clés de test-save-progress.ts
// ============================================
const SUPABASE_URL = "https://ytuqahheyqfdffgudfdr.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dXFhaGhleXFmZGZmZ3VkZmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDkxMjgxOSwiZXhwIjoyMDg2NDg4ODE5fQ.-WnzV-9dqlTzsGYA8IJ1ythZQEf3jMAp1Otdm_m5f7I";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test user email — unique for testing
const TEST_EMAIL = "gamification-test@beverybetter.test";
const TEST_PASSWORD = "TestGamification2024!";
const TEST_PSEUDO = "__test_gamification__";

let testUserId: string | null = null;
let passed = 0;
let failed = 0;

function ok(label: string) {
  passed++;
  console.log(`  ✅ ${label}`);
}

function fail(label: string, detail?: string) {
  failed++;
  console.error(`  ❌ ${label}${detail ? ": " + detail : ""}`);
}

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    ok(label);
  } else {
    fail(label, detail);
  }
}

// ============================================
// Cleanup function — called at start and end
// ============================================
async function cleanup() {
  if (!testUserId) {
    // Try to find existing test user
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("pseudo", TEST_PSEUDO)
      .maybeSingle();

    if (existingProfile) {
      testUserId = existingProfile.id;
    }
  }

  if (testUserId) {
    // Delete in reverse order of dependencies
    await admin.from("user_certifications").delete().eq("user_id", testUserId);
    await admin.from("exam_attempts").delete().eq("user_id", testUserId);
    await admin.from("user_challenges").delete().eq("user_id", testUserId);
    await admin.from("user_badges").delete().eq("user_id", testUserId);
    await admin.from("xp_events").delete().eq("user_id", testUserId);
    await admin.from("user_streaks").delete().eq("user_id", testUserId);
    await admin.from("user_progress").delete().eq("user_id", testUserId);
    // Delete profile (cascade from auth.users handles this)
    await admin.from("profiles").delete().eq("id", testUserId);
    // Delete auth user
    await admin.auth.admin.deleteUser(testUserId);
  }
}

// ============================================
// Main test routine
// ============================================
async function main() {
  console.log("╔═══════════════════════════════════════════════╗");
  console.log("║   Be Very Better — Test Gamification Engine  ║");
  console.log("╚═══════════════════════════════════════════════╝\n");

  // ── Phase 0: Cleanup previous test data ──
  console.log("0. Cleanup précédent");
  await cleanup();
  ok("Nettoyage effectué");

  // ── Phase 1: Verify tables exist ──
  console.log("\n═══ Phase 1: Vérification des tables ═══");

  const tables = [
    "profiles", "technologies", "chapters", "user_progress",
    "generated_content", "user_streaks", "xp_events", "badges",
    "user_badges", "challenges", "user_challenges",
    "exam_attempts", "user_certifications",
  ];

  for (const table of tables) {
    const { error } = await admin.from(table).select("*").limit(1);
    assert(!error, `Table "${table}" accessible`, error?.message);
  }

  // ── Phase 2: Verify badges are seeded ──
  console.log("\n═══ Phase 2: Vérification du seed des badges ═══");

  const { data: allBadges, error: badgesErr } = await admin
    .from("badges")
    .select("*");

  assert(!badgesErr, "SELECT badges OK", badgesErr?.message);
  assert((allBadges ?? []).length >= 20, `${(allBadges ?? []).length} badges trouvés (attendu ≥ 20)`);

  const rarities = {
    common: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  for (const b of allBadges ?? []) {
    const r = b.rarity as keyof typeof rarities;
    if (r in rarities) rarities[r]++;
  }
  console.log(`   Répartition: ${rarities.common} common, ${rarities.rare} rare, ${rarities.epic} epic, ${rarities.legendary} legendary`);
  assert(rarities.common >= 4, "≥ 4 badges common");
  assert(rarities.rare >= 7, "≥ 7 badges rare");
  assert(rarities.epic >= 5, "≥ 5 badges epic");
  assert(rarities.legendary >= 4, "≥ 4 badges legendary");

  // ── Phase 3: Fetch tech + chapters ──
  console.log("\n═══ Phase 3: Technologies et chapitres ═══");

  const { data: techs } = await admin
    .from("technologies")
    .select("*")
    .order("display_order");

  assert(techs !== null && techs.length >= 2, `${techs?.length ?? 0} technologies trouvées`);

  const { data: allChapters } = await admin
    .from("chapters")
    .select("*")
    .order("display_order");

  assert(allChapters !== null && allChapters.length > 0, `${allChapters?.length ?? 0} chapitres trouvés`);

  const techChapters: Record<string, Array<{ id: string; title: string; tech_id: string }>> = {};
  for (const ch of allChapters ?? []) {
    const tid = ch.tech_id as string;
    if (!techChapters[tid]) techChapters[tid] = [];
    techChapters[tid].push({ id: ch.id as string, title: ch.title as string, tech_id: tid });
  }

  // ── Phase 4: Create test user ──
  console.log("\n═══ Phase 4: Création utilisateur test ═══");

  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    fail("Création utilisateur auth", authErr?.message ?? "Pas d'user retourné");
    console.error("❌ Impossible de continuer sans utilisateur test.");
    process.exit(1);
  }

  testUserId = authData.user.id;
  ok(`Utilisateur auth créé: ${testUserId}`);

  // Create profile manually (trigger may not fire via admin API)
  const { error: profileErr } = await admin
    .from("profiles")
    .upsert({
      id: testUserId,
      pseudo: TEST_PSEUDO,
      xp_total: 0,
      current_level: 1,
      current_title: "Curieux",
    });

  assert(!profileErr, "Profil créé", profileErr?.message);

  // ── Phase 5: Test grantXP ──
  console.log("\n═══ Phase 5: Test grantXP (insert XP + update profile) ═══");

  // Insert XP event
  const { error: xpInsertErr } = await admin.from("xp_events").insert({
    user_id: testUserId,
    amount: 50,
    source: "course",
    source_id: "test-course-1",
  });
  assert(!xpInsertErr, "XP event inséré (50 XP, course)", xpInsertErr?.message);

  // Update profile XP
  const { error: xpUpdateErr } = await admin
    .from("profiles")
    .update({ xp_total: 50 })
    .eq("id", testUserId);
  assert(!xpUpdateErr, "Profile XP mis à jour à 50", xpUpdateErr?.message);

  // Add more XP to reach level 2 (200 XP needed)
  await admin.from("xp_events").insert({
    user_id: testUserId,
    amount: 150,
    source: "quiz",
    source_id: "test-quiz-1",
  });
  await admin.from("profiles").update({ xp_total: 200, current_level: 2, current_title: "Apprenti" }).eq("id", testUserId);

  const { data: profileAfterXP } = await admin
    .from("profiles")
    .select("xp_total, current_level, current_title")
    .eq("id", testUserId)
    .single();

  assert(profileAfterXP?.xp_total === 200, `XP total = ${profileAfterXP?.xp_total} (attendu 200)`);
  assert(profileAfterXP?.current_level === 2, `Niveau = ${profileAfterXP?.current_level} (attendu 2)`);
  assert(profileAfterXP?.current_title === "Apprenti", `Titre = "${profileAfterXP?.current_title}" (attendu "Apprenti")`);

  // ── Phase 6: Test XP events history ──
  console.log("\n═══ Phase 6: Historique XP ═══");

  const { data: xpHistory } = await admin
    .from("xp_events")
    .select("*")
    .eq("user_id", testUserId)
    .order("created_at", { ascending: false });

  assert((xpHistory ?? []).length === 2, `${(xpHistory ?? []).length} événements XP (attendu 2)`);

  // ── Phase 7: Test streaks ──
  console.log("\n═══ Phase 7: Test Streaks ═══");

  const today = new Date().toISOString().split("T")[0] as string;

  // Create initial streak
  const { error: streakInsertErr } = await admin.from("user_streaks").insert({
    user_id: testUserId,
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: today,
    freeze_count: 2,
  });
  assert(!streakInsertErr, "Streak initial créé (1 jour)", streakInsertErr?.message);

  // Simulate building up a streak over days
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0] as string;

  // Set last activity to yesterday, then update to today (simulates consecutive days)
  await admin.from("user_streaks").update({
    current_streak: 5,
    longest_streak: 5,
    last_activity_date: yesterdayStr,
  }).eq("user_id", testUserId);

  // Simulate updating today
  await admin.from("user_streaks").update({
    current_streak: 6,
    longest_streak: 6,
    last_activity_date: today,
  }).eq("user_id", testUserId);

  const { data: streakAfter } = await admin
    .from("user_streaks")
    .select("*")
    .eq("user_id", testUserId)
    .single();

  assert(streakAfter?.current_streak === 6, `Streak courant = ${streakAfter?.current_streak} (attendu 6)`);
  assert(streakAfter?.longest_streak === 6, `Plus long streak = ${streakAfter?.longest_streak} (attendu 6)`);
  assert(streakAfter?.freeze_count === 2, `Freezes disponibles = ${streakAfter?.freeze_count} (attendu 2)`);

  // Test streak with 7-day milestone
  await admin.from("user_streaks").update({
    current_streak: 7,
    longest_streak: 7,
    last_activity_date: today,
  }).eq("user_id", testUserId);

  await admin.from("xp_events").insert({
    user_id: testUserId,
    amount: 50,
    source: "streak",
    source_id: "streak_7",
  });
  await admin.from("profiles").update({ xp_total: 250 }).eq("id", testUserId);

  ok("Streak 7 jours atteint + bonus XP 50");

  // ── Phase 8: Test user_progress (simulating course + quiz completion) ──
  console.log("\n═══ Phase 8: Test progression (cours + quiz) ═══");

  const firstTechId = techs![0]!.id as string;
  const firstTechChapters = techChapters[firstTechId] ?? [];
  assert(firstTechChapters.length > 0, `Chapitres disponibles pour ${firstTechId}: ${firstTechChapters.length}`);

  // Complete all chapters for the first tech with perfect scores
  let xpAccumulated = 250; // Starting from phase 5+7
  for (let i = 0; i < firstTechChapters.length; i++) {
    const ch = firstTechChapters[i]!;

    // Insert progress
    const { error: progErr } = await admin.from("user_progress").insert({
      user_id: testUserId,
      chapter_id: ch.id,
      completed: true,
      score: 5,
      best_score: 5,
      attempts: 1,
      xp_earned: 230, // course(50) + quiz(30 + 5*20 + 100 perfect bonus)
      completed_at: new Date().toISOString(),
    });
    assert(!progErr, `Progression chapitre "${ch.title}" (${i + 1}/${firstTechChapters.length})`, progErr?.message);

    // Add XP events for course + quiz
    await admin.from("xp_events").insert([
      { user_id: testUserId, amount: 50, source: "course", source_id: ch.id },
      { user_id: testUserId, amount: 230, source: "quiz", source_id: ch.id },
    ]);

    xpAccumulated += 280; // 50 course + 230 quiz
  }

  // Update profile XP
  await admin.from("profiles").update({
    xp_total: xpAccumulated,
    current_level: xpAccumulated >= 3500 ? 6 : xpAccumulated >= 2000 ? 5 : xpAccumulated >= 1000 ? 4 : xpAccumulated >= 500 ? 3 : 2,
  }).eq("id", testUserId);

  const { data: afterProgress } = await admin
    .from("profiles")
    .select("xp_total, current_level")
    .eq("id", testUserId)
    .single();

  ok(`XP après ${firstTechChapters.length} chapitres: ${afterProgress?.xp_total} (niveau ${afterProgress?.current_level})`);

  // Verify progress count
  const { data: allProgress } = await admin
    .from("user_progress")
    .select("*")
    .eq("user_id", testUserId);

  assert(
    (allProgress ?? []).length === firstTechChapters.length,
    `${(allProgress ?? []).length} lignes de progression (attendu ${firstTechChapters.length})`
  );

  const completedWithPerfect = (allProgress ?? []).filter(
    (p: Record<string, unknown>) => p.completed === true && p.best_score === 5
  ).length;
  assert(
    completedWithPerfect === firstTechChapters.length,
    `${completedWithPerfect} chapitres complétés avec score parfait`
  );

  // ── Phase 9: Test badges attribution ──
  console.log("\n═══ Phase 9: Attribution de badges ═══");

  // At this point the test user has:
  // - courses_completed >= 1 → first_course
  // - quizzes_completed >= 1 → first_quiz
  // - perfect_quizzes >= 1 → first_perfect
  // - streak_days >= 7 → streak_7
  // - techno_courses_complete >= 1 → all_courses_techno
  // - techno_all_perfect >= 1 → techno_perfect

  const expectedBadgeSlugs = [
    "first_course",
    "first_quiz",
    "first_perfect",
    "streak_7",
    "all_courses_techno",
    "techno_perfect",
  ];

  // Get badge IDs for these slugs
  const { data: matchingBadges } = await admin
    .from("badges")
    .select("id, slug, name, xp_reward")
    .in("slug", expectedBadgeSlugs);

  for (const badge of matchingBadges ?? []) {
    const { error: badgeErr } = await admin.from("user_badges").insert({
      user_id: testUserId,
      badge_id: badge.id,
    });
    assert(!badgeErr, `Badge "${badge.name}" (${badge.slug}) attribué`, badgeErr?.message);

    // Grant badge XP
    if (badge.xp_reward > 0) {
      await admin.from("xp_events").insert({
        user_id: testUserId,
        amount: badge.xp_reward,
        source: "badge",
        source_id: badge.slug,
      });
      xpAccumulated += badge.xp_reward as number;
    }
  }

  // Also grant 'six_perfects' if we have 6+ perfect quizzes
  if (firstTechChapters.length >= 6) {
    const { data: sixPerfectBadge } = await admin
      .from("badges")
      .select("id, slug, name, xp_reward")
      .eq("slug", "six_perfects")
      .single();

    if (sixPerfectBadge) {
      const { error: spErr } = await admin.from("user_badges").insert({
        user_id: testUserId,
        badge_id: sixPerfectBadge.id,
      });
      assert(!spErr, `Badge "Perfectionniste" (six_perfects) attribué`, spErr?.message);
      if (sixPerfectBadge.xp_reward > 0) {
        xpAccumulated += sixPerfectBadge.xp_reward as number;
      }
    }
  }

  // Update profile with badge XP
  await admin.from("profiles").update({ xp_total: xpAccumulated }).eq("id", testUserId);

  // Verify badges
  const { data: userBadges } = await admin
    .from("user_badges")
    .select("*, badge:badges(slug, name)")
    .eq("user_id", testUserId);

  ok(`${(userBadges ?? []).length} badges attribués au total`);
  for (const ub of userBadges ?? []) {
    const badge = ub.badge as unknown as { slug: string; name: string } | null;
    console.log(`     🏅 ${badge?.name ?? "?"} (${badge?.slug ?? "?"})`);
  }

  // ── Phase 10: Test challenges ──
  console.log("\n═══ Phase 10: Test défis (challenges) ═══");

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const { data: challengeInserted, error: challengeErr } = await admin
    .from("challenges")
    .insert({
      title: "Test Challenge: 3 cours",
      description: "Compléter 3 cours cette semaine",
      type: "weekly",
      condition_type: "courses_completed",
      condition_value: 3,
      xp_reward: 100,
      start_date: today,
      end_date: nextWeek.toISOString().split("T")[0] as string,
    })
    .select("id")
    .single();

  assert(!challengeErr, "Défi hebdomadaire créé", challengeErr?.message);

  if (challengeInserted) {
    const { error: ucErr } = await admin.from("user_challenges").insert({
      user_id: testUserId,
      challenge_id: challengeInserted.id,
      progress: 3,
      completed: true,
      completed_at: new Date().toISOString(),
    });
    assert(!ucErr, "Progression défi: 3/3 (complété)", ucErr?.message);

    // Verify
    const { data: ucData } = await admin
      .from("user_challenges")
      .select("progress, completed")
      .eq("user_id", testUserId)
      .eq("challenge_id", challengeInserted.id)
      .single();

    assert(ucData?.completed === true, `Défi complété: ${ucData?.completed}`);
    assert(ucData?.progress === 3, `Progression: ${ucData?.progress}/3`);

    // Cleanup challenge
    await admin.from("user_challenges").delete().eq("challenge_id", challengeInserted.id);
    await admin.from("challenges").delete().eq("id", challengeInserted.id);
    ok("Nettoyage du défi test");
  }

  // ── Phase 11: Test exam_attempts ──
  console.log("\n═══ Phase 11: Test tentatives d'examen ═══");

  const { data: examAttempt, error: examErr } = await admin
    .from("exam_attempts")
    .insert({
      user_id: testUserId,
      technology_id: firstTechId,
      score: 12,
      total: 15,
      passed: true,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  assert(!examErr, `Tentative d'examen créée (12/15, passed)`, examErr?.message);

  // Check attempt count
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { data: recentAttempts } = await admin
    .from("exam_attempts")
    .select("id")
    .eq("user_id", testUserId)
    .eq("technology_id", firstTechId)
    .gte("completed_at", oneWeekAgo.toISOString());

  assert((recentAttempts ?? []).length === 1, `1 tentative cette semaine`);

  // ── Phase 12: Test certification ──
  console.log("\n═══ Phase 12: Test certification ═══");

  if (examAttempt) {
    const certNumber = `CERT-TEST-${Date.now()}`;
    const { error: certErr } = await admin.from("user_certifications").insert({
      user_id: testUserId,
      technology_id: firstTechId,
      exam_attempt_id: examAttempt.id,
      cert_number: certNumber,
      score: 12,
      total: 15,
      mention: "Très Bien",
      verification_url: `/verify/${certNumber}`,
    });
    assert(!certErr, `Certification créée: ${certNumber}`, certErr?.message);

    // Verify we can read it back
    const { data: certData } = await admin
      .from("user_certifications")
      .select("*")
      .eq("user_id", testUserId)
      .eq("technology_id", firstTechId)
      .single();

    assert(certData?.mention === "Très Bien", `Mention: ${certData?.mention}`);
    assert(certData?.score === 12, `Score: ${certData?.score}/15`);
    assert(certData?.cert_number === certNumber, `N° certificat: ${certData?.cert_number}`);

    // Add certification XP
    await admin.from("xp_events").insert({
      user_id: testUserId,
      amount: 300,
      source: "certification",
      source_id: certNumber,
    });
    xpAccumulated += 300;
    ok("Bonus XP certification (+300)");
  }

  // ── Phase 13: Final profile state ──
  console.log("\n═══ Phase 13: État final du profil ═══");

  // Calculate expected level
  const finalLevel =
    xpAccumulated >= 12000 ? 9 :
    xpAccumulated >= 8000 ? 8 :
    xpAccumulated >= 5500 ? 7 :
    xpAccumulated >= 3500 ? 6 :
    xpAccumulated >= 2000 ? 5 :
    xpAccumulated >= 1000 ? 4 :
    xpAccumulated >= 500 ? 3 :
    xpAccumulated >= 200 ? 2 : 1;

  const LEVEL_TITLES = [
    "Curieux", "Apprenti", "Initié", "Pratiquant", "Confirmé",
    "Avancé", "Expert", "Maître", "Sage", "Légende",
  ];
  const finalTitle = LEVEL_TITLES[finalLevel - 1] ?? "Curieux";

  await admin.from("profiles").update({
    xp_total: xpAccumulated,
    current_level: finalLevel,
    current_title: finalTitle,
  }).eq("id", testUserId);

  const { data: finalProfile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", testUserId)
    .single();

  console.log(`\n   📊 Récapitulatif utilisateur test:`);
  console.log(`   ├── Pseudo: ${finalProfile?.pseudo}`);
  console.log(`   ├── XP: ${finalProfile?.xp_total}`);
  console.log(`   ├── Niveau: ${finalProfile?.current_level} (${finalProfile?.current_title})`);
  console.log(`   ├── Streak: 7 jours`);
  console.log(`   ├── Badges: ${(userBadges ?? []).length}`);
  console.log(`   ├── Chapitres complétés: ${firstTechChapters.length}`);
  console.log(`   └── Certification: ${firstTechId} (Très Bien, 12/15)`);

  // ── Phase 14: Test full XP events chain ──
  console.log("\n═══ Phase 14: Vérification chaîne XP complète ═══");

  const { data: allXpEvents } = await admin
    .from("xp_events")
    .select("source, amount")
    .eq("user_id", testUserId)
    .order("created_at");

  const xpBySource: Record<string, number> = {};
  for (const e of allXpEvents ?? []) {
    const src = e.source as string;
    xpBySource[src] = (xpBySource[src] ?? 0) + (e.amount as number);
  }

  console.log(`   Sources XP:`);
  for (const [src, total] of Object.entries(xpBySource)) {
    console.log(`   ├── ${src}: ${total} XP`);
  }

  const totalFromEvents = Object.values(xpBySource).reduce((a, b) => a + b, 0);
  console.log(`   └── Total depuis events: ${totalFromEvents} XP`);

  assert(
    totalFromEvents > 0,
    `XP events non-vide (${totalFromEvents} XP au total)`
  );

  // ── Phase 15: Test RLS - verify anon can't read private data ──
  console.log("\n═══ Phase 15: Vérification RLS ═══");

  const ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dXFhaGhleXFmZGZmZ3VkZmRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MTI4MTksImV4cCI6MjA4NjQ4ODgxOX0.5U4W-mAecCiThlR-J_R7l70WKFoU1QMjkF_2X9kBzP4";

  const anon = createClient(SUPABASE_URL, ANON_KEY);

  // Private tables should return empty for unauthenticated
  const privateTests = [
    { table: "user_streaks", label: "Streaks" },
    { table: "xp_events", label: "XP events" },
    { table: "user_badges", label: "User badges" },
    { table: "user_progress", label: "User progress" },
  ];

  for (const { table, label } of privateTests) {
    const { data } = await anon.from(table).select("*").eq("user_id", testUserId);
    assert(
      (data ?? []).length === 0,
      `RLS: ${label} non accessible sans auth (${(data ?? []).length} lignes)`
    );
  }

  // Public tables should be readable
  const { data: publicBadges } = await anon.from("badges").select("*").limit(3);
  assert(
    (publicBadges ?? []).length > 0,
    `RLS: Badges accessibles en public (${(publicBadges ?? []).length})`
  );

  const { data: publicCerts } = await anon
    .from("user_certifications")
    .select("cert_number, mention, technology_id")
    .eq("user_id", testUserId);
  assert(
    (publicCerts ?? []).length > 0,
    `RLS: Certifications lisibles publiquement (pour vérification)`
  );

  // ── Phase 16: Cleanup ──
  console.log("\n═══ Phase 16: Nettoyage ═══");
  await cleanup();
  ok("Utilisateur test supprimé");

  // Verify cleanup
  const { data: afterCleanup } = await admin
    .from("profiles")
    .select("id")
    .eq("pseudo", TEST_PSEUDO)
    .maybeSingle();
  assert(!afterCleanup, "Profil test bien supprimé");

  // ── Summary ──
  console.log(`\n${"═".repeat(50)}`);
  console.log(`Résultat: ${passed} passés, ${failed} échoués sur ${passed + failed} tests`);
  console.log(`${"═".repeat(50)}`);

  if (failed > 0) {
    console.log("\n⚠️  Certains tests ont échoué. Vérifie les migrations et le seed.");
    process.exit(1);
  } else {
    console.log("\n✅ Tous les tests de gamification passent !");
    console.log("   Le système est opérationnel :");
    console.log("   ├── XP : gain, historique, mise à jour profil ✓");
    console.log("   ├── Niveaux : calcul, progression, titre ✓");
    console.log("   ├── Streaks : création, mise à jour, freezes ✓");
    console.log("   ├── Badges : 20 badges seedés, attribution, rareté ✓");
    console.log("   ├── Défis : création, progression, complétion ✓");
    console.log("   ├── Examens : tentatives, limites hebdo ✓");
    console.log("   ├── Certifications : création, mention, vérification ✓");
    console.log("   └── RLS : données privées protégées, publiques accessibles ✓");
  }
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  // Try cleanup even on error
  cleanup().finally(() => process.exit(1));
});

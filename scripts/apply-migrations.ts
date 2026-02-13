/**
 * Apply pending migrations to Supabase via direct PostgreSQL connection.
 *
 * Usage: npx tsx scripts/apply-migrations.ts
 */

import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";

// Direct connection (non-pooled) to Supabase Postgres
// Set DATABASE_URL env var or replace with your connection string
const DATABASE_URL = process.env.DATABASE_URL ?? "";

const MIGRATIONS = [
  "004_gamification.sql",
  "005_seed_badges.sql",
  "006_user_certifications.sql",
];

async function main() {
  console.log("=== Applying Supabase Gamification Migrations ===\n");

  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("✅ Connecté à PostgreSQL\n");

  try {
    for (const migration of MIGRATIONS) {
      const filePath = join(process.cwd(), "supabase", "migrations", migration);
      let sql: string;

      try {
        sql = readFileSync(filePath, "utf-8");
      } catch {
        console.error(`❌ Fichier non trouvé: ${filePath}`);
        continue;
      }

      console.log(`→ ${migration}`);
      try {
        await client.query(sql);
        console.log(`  ✅ Appliqué avec succès`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        // Check if it's "already exists" errors (safe to ignore)
        if (msg.includes("already exists") || msg.includes("duplicate")) {
          console.log(`  ⚠️  Déjà appliqué (${msg.split("\n")[0]})`);
        } else {
          console.error(`  ❌ Erreur: ${msg}`);
        }
      }
    }

    // Verify tables exist
    console.log("\nVérification...");
    const tables = [
      "user_streaks", "xp_events", "badges", "user_badges",
      "challenges", "user_challenges", "exam_attempts", "user_certifications",
    ];
    for (const table of tables) {
      try {
        await client.query(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`  ✅ ${table}`);
      } catch {
        console.log(`  ❌ ${table} — table introuvable`);
      }
    }

    // Verify badges seed
    const { rows } = await client.query("SELECT COUNT(*) as count FROM badges");
    console.log(`\n  🏅 ${rows[0]?.count ?? 0} badges en base`);

  } finally {
    await client.end();
    console.log("\n✅ Connexion fermée.");
  }
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  process.exit(1);
});

#!/usr/bin/env node
// ============================================
// Be Very Better — Script de pré-génération du contenu
// ============================================
// Usage : node scripts/generate-content.mjs
//
// Ce script appelle l'API Claude pour générer les cours et QCM
// de tous les chapitres, puis produit un fichier SQL d'insertion.
//
// Prérequis : ANTHROPIC_API_KEY dans .env.local
// ============================================

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 3000;

// ---- Données des chapitres (miroir de 002_seed_data.sql) ----
const CHAPTERS = [
  // Next.js
  { tech: "Next.js", techId: "nextjs", title: "Introduction à Next.js", desc: "Découvre ce qu'est Next.js, pourquoi l'utiliser et comment créer ton premier projet.", level: "débutant", order: 1 },
  { tech: "Next.js", techId: "nextjs", title: "Le Routing (App Router)", desc: "Comprends le système de routing basé sur les fichiers avec le App Router de Next.js 13+.", level: "débutant", order: 2 },
  { tech: "Next.js", techId: "nextjs", title: "Les Composants Server & Client", desc: "Maîtrise la différence entre Server Components et Client Components.", level: "débutant", order: 3 },
  { tech: "Next.js", techId: "nextjs", title: "Le Data Fetching", desc: "Apprends à récupérer des données côté serveur et côté client dans Next.js.", level: "intermédiaire", order: 4 },
  { tech: "Next.js", techId: "nextjs", title: "Les Server Actions", desc: "Utilise les Server Actions pour gérer les mutations de données sans API.", level: "intermédiaire", order: 5 },
  { tech: "Next.js", techId: "nextjs", title: "Le Rendering (SSR, SSG, ISR)", desc: "Comprends les stratégies de rendu : Static, Server-Side et Incremental.", level: "intermédiaire", order: 6 },
  { tech: "Next.js", techId: "nextjs", title: "Middleware & Auth", desc: "Implémente des middlewares et la gestion d'authentification.", level: "avancé", order: 7 },
  { tech: "Next.js", techId: "nextjs", title: "Optimisation & Déploiement", desc: "Optimise les performances et déploie sur Vercel.", level: "avancé", order: 8 },
  // Tailwind CSS
  { tech: "Tailwind CSS", techId: "tailwind", title: "Introduction à Tailwind", desc: "Découvre l'approche utility-first et installe Tailwind dans ton projet.", level: "débutant", order: 1 },
  { tech: "Tailwind CSS", techId: "tailwind", title: "Layout & Spacing", desc: "Maîtrise Flexbox, Grid, padding, margin et le système d'espacement.", level: "débutant", order: 2 },
  { tech: "Tailwind CSS", techId: "tailwind", title: "Typographie & Couleurs", desc: "Gère les polices, tailles de texte et la palette de couleurs Tailwind.", level: "débutant", order: 3 },
  { tech: "Tailwind CSS", techId: "tailwind", title: "Responsive Design", desc: "Crée des interfaces adaptatives avec les breakpoints de Tailwind.", level: "intermédiaire", order: 4 },
  { tech: "Tailwind CSS", techId: "tailwind", title: "États & Pseudo-classes", desc: "Utilise hover, focus, active, group et les variants conditionnels.", level: "intermédiaire", order: 5 },
  { tech: "Tailwind CSS", techId: "tailwind", title: "Animations & Transitions", desc: "Ajoute du mouvement avec les classes d'animation et de transition.", level: "intermédiaire", order: 6 },
  { tech: "Tailwind CSS", techId: "tailwind", title: "Personnalisation du thème", desc: "Étends et personnalise Tailwind via tailwind.config.js.", level: "avancé", order: 7 },
  { tech: "Tailwind CSS", techId: "tailwind", title: "Composants réutilisables & @apply", desc: "Crée des patterns réutilisables et organise ton CSS.", level: "avancé", order: 8 },
];

// ---- Prompts ----

function coursePrompt(chapter) {
  return `Tu es un formateur expert en ${chapter.tech}.
Génère un cours complet pour le chapitre "${chapter.title}".
Contexte : ${chapter.desc}
Niveau de l'apprenant : ${chapter.level}

RÈGLES :
- Le cours doit avoir 3 à 5 sections
- Chaque section a un titre clair et un contenu détaillé (200-400 mots par section)
- Inclus des exemples de code concrets avec des backticks triples dans le contenu
- Adapte la complexité au niveau ${chapter.level}
- Ajoute 3 à 5 points clés à retenir
- Le contenu doit être pédagogique, concret, orienté pratique
- Utilise le tutoiement
- Écris en français

RÉPONDS UNIQUEMENT avec du JSON valide, sans backticks, sans markdown autour :
{
  "sections": [
    { "title": "Titre de la section", "content": "Contenu avec des \`\`\`code\`\`\` si besoin" }
  ],
  "keyPoints": ["Point clé 1", "Point clé 2", "..."]
}`;
}

function qcmPrompt(chapter) {
  return `Tu es un formateur expert en ${chapter.tech}.
Génère un QCM de 5 questions pour le chapitre "${chapter.title}".
Contexte : ${chapter.desc}
Niveau de l'apprenant : ${chapter.level}

RÈGLES :
- Exactement 5 questions
- 4 options par question (une seule bonne réponse)
- Difficulté progressive (question 1 = facile, question 5 = plus difficile)
- Questions concrètes et pratiques (pas de piège)
- Explication courte (1-2 phrases) pour chaque question
- Adapte au niveau ${chapter.level}
- Écris en français

RÉPONDS UNIQUEMENT avec du JSON valide, sans backticks, sans markdown autour :
[
  {
    "question": "La question ?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Explication de la bonne réponse."
  }
]`;
}

// ---- Appel Claude ----

async function callClaude(prompt) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();

  // Nettoyer les éventuels backticks markdown autour du JSON
  const cleaned = text
    .replace(/^```json?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  return JSON.parse(cleaned);
}

// ---- Génération ----

async function main() {
  console.log("🚀 Début de la génération du contenu...\n");

  const results = [];
  let sqlOutput = `-- ============================================
-- Be Very Better — Contenu pré-généré
-- Généré le ${new Date().toISOString().split("T")[0]}
-- ============================================

-- Ce fichier insère le contenu généré par Claude dans generated_content.
-- Il utilise les chapter IDs en se basant sur (tech_id, display_order).
-- À exécuter APRÈS 001_initial_schema.sql et 002_seed_data.sql.

`;

  for (let i = 0; i < CHAPTERS.length; i++) {
    const chapter = CHAPTERS[i];
    const label = `[${i + 1}/${CHAPTERS.length}] ${chapter.tech} — ${chapter.title}`;

    // Générer le cours
    console.log(`📖 ${label} — Génération du cours...`);
    try {
      const course = await callClaude(coursePrompt(chapter));
      const courseJson = JSON.stringify(course).replace(/'/g, "''");

      sqlOutput += `-- Cours : ${chapter.title}\n`;
      sqlOutput += `INSERT INTO generated_content (chapter_id, content_type, content)\n`;
      sqlOutput += `SELECT c.id, 'course', '${courseJson}'::jsonb\n`;
      sqlOutput += `FROM chapters c WHERE c.tech_id = '${chapter.techId}' AND c.display_order = ${chapter.order};\n\n`;

      results.push({ chapter: label, type: "course", status: "✅" });
    } catch (err) {
      console.error(`   ❌ Erreur cours : ${err.message}`);
      results.push({ chapter: label, type: "course", status: "❌", error: err.message });
    }

    // Pause pour éviter le rate limit
    await new Promise((r) => setTimeout(r, 2000));

    // Générer le QCM
    console.log(`✅ ${label} — Génération du QCM...`);
    try {
      const qcm = await callClaude(qcmPrompt(chapter));
      const qcmJson = JSON.stringify(qcm).replace(/'/g, "''");

      sqlOutput += `-- QCM : ${chapter.title}\n`;
      sqlOutput += `INSERT INTO generated_content (chapter_id, content_type, content)\n`;
      sqlOutput += `SELECT c.id, 'qcm', '${qcmJson}'::jsonb\n`;
      sqlOutput += `FROM chapters c WHERE c.tech_id = '${chapter.techId}' AND c.display_order = ${chapter.order};\n\n`;

      results.push({ chapter: label, type: "qcm", status: "✅" });
    } catch (err) {
      console.error(`   ❌ Erreur QCM : ${err.message}`);
      results.push({ chapter: label, type: "qcm", status: "❌", error: err.message });
    }

    // Pause entre chapitres
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Écrire le fichier SQL
  const outputPath = "supabase/migrations/003_generated_content.sql";
  writeFileSync(outputPath, sqlOutput, "utf-8");

  // Résumé
  console.log("\n============================================");
  console.log("📊 Résumé de la génération");
  console.log("============================================");
  const success = results.filter((r) => r.status === "✅").length;
  const failed = results.filter((r) => r.status === "❌").length;
  console.log(`✅ Réussies : ${success}/${results.length}`);
  console.log(`❌ Échouées : ${failed}/${results.length}`);
  console.log(`\n📄 Fichier SQL généré : ${outputPath}`);
  console.log("\nExécute ce fichier dans Supabase pour insérer le contenu.");
}

main().catch(console.error);

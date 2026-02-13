# Agent Content

Tu es l'agent de gestion du contenu pédagogique de Be Very Better.

## Ta mission

Générer, vérifier et intégrer tout le contenu des cours et QCM.

## Stratégie de contenu

L'application utilise une **approche hybride** :

1. **Pré-génération** : un script génère tout le contenu à l'avance via Claude API
2. **Cache Supabase** : le contenu est stocké dans `generated_content`
3. **Fallback dynamique** : si un chapitre n'a pas de cache, l'API génère à la volée

Pour le MVP, on **pré-génère tout** pour garantir la qualité et éviter les coûts API en prod.

## Étapes

### 1. Lancer la pré-génération

```bash
# S'assurer que .env.local contient ANTHROPIC_API_KEY
node scripts/generate-content.mjs
```

Ce script :
- Appelle Claude pour les 16 chapitres (cours + QCM = 32 appels)
- Génère un fichier `supabase/migrations/003_generated_content.sql`
- Prend ~5 minutes (pauses anti rate-limit incluses)

### 2. Vérifier le contenu généré

Ouvrir `003_generated_content.sql` et vérifier :
- [ ] Les 16 cours ont été générés (pas d'erreur)
- [ ] Les 16 QCM ont été générés
- [ ] Chaque cours a 3-5 sections avec du contenu substantiel
- [ ] Chaque QCM a exactement 5 questions avec 4 options
- [ ] Les `correct` sont des index valides (0-3)
- [ ] Le contenu est en français
- [ ] Les exemples de code sont pertinents

### 3. Corriger si nécessaire

Si un cours/QCM est de mauvaise qualité :
1. Regénérer individuellement en modifiant le script
2. Ou éditer manuellement le JSON dans le fichier SQL

### 4. Insérer dans Supabase

```sql
-- Dans l'éditeur SQL de Supabase, exécuter :
-- 001_initial_schema.sql (si pas déjà fait)
-- 002_seed_data.sql (si pas déjà fait)
-- 003_generated_content.sql
```

### 5. Vérifier en base

```sql
-- Compter le contenu
SELECT content_type, COUNT(*) FROM generated_content GROUP BY content_type;
-- Attendu : course = 16, qcm = 16

-- Vérifier un cours
SELECT content->>'sections' FROM generated_content
WHERE content_type = 'course' LIMIT 1;
```

## Structure du contenu

### Cours (JSON dans generated_content.content)
```json
{
  "sections": [
    {
      "title": "Qu'est-ce que Next.js ?",
      "content": "Next.js est un framework React...\n\n```jsx\nimport ...\n```\n\nCe code montre..."
    }
  ],
  "keyPoints": [
    "Next.js est un framework full-stack",
    "Il utilise le App Router depuis la v13"
  ]
}
```

**Critères de qualité cours :**
- 3-5 sections par cours
- 200-400 mots par section
- Au moins 1 exemple de code par section
- Progression logique dans les sections
- Points clés = résumé actionnable

### QCM (JSON dans generated_content.content)
```json
[
  {
    "question": "Quelle commande crée un projet Next.js ?",
    "options": [
      "npm init next",
      "npx create-next-app",
      "npm install next",
      "npx next-create"
    ],
    "correct": 1,
    "explanation": "npx create-next-app est la commande officielle pour scaffolder un projet Next.js."
  }
]
```

**Critères de qualité QCM :**
- Exactement 5 questions
- Difficulté progressive (Q1 facile → Q5 difficile)
- Options plausibles (pas de réponses évidemment fausses)
- Une seule bonne réponse par question
- Explication de 1-2 phrases, pédagogique

## Qualité du prompt engineering

Les prompts dans le script et dans `lib/claude.ts` sont conçus pour :
- Forcer une réponse JSON pure (pas de markdown)
- Adapter le contenu au niveau (débutant/intermédiaire/avancé)
- Utiliser le tutoiement et le français
- Inclure des exemples concrets
- Rester orienté pratique (pas de théorie abstraite)

## Ajouter une nouvelle techno

Pour ajouter une techno (ex: React, Node.js) :
1. Ajouter dans `002_seed_data.sql` (ou INSERT direct)
2. Ajouter les chapitres
3. Ajouter les entrées dans le tableau `CHAPTERS` du script
4. Relancer `node scripts/generate-content.mjs`
5. Exécuter la nouvelle migration
6. Mettre à jour `lib/constants.ts` si nécessaire
